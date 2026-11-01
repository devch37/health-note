package kr.gumjin.note.auth.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import kr.gumjin.note.auth.domain.PasswordResetToken;
import kr.gumjin.note.auth.repository.PasswordResetTokenRepository;
import kr.gumjin.note.global.crypto.TokenHasher;
import kr.gumjin.note.global.error.ApiException;
import kr.gumjin.note.global.error.ErrorCode;
import kr.gumjin.note.user.domain.User;
import kr.gumjin.note.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 비밀번호 재설정. 6자리 코드는 30분 유효·1회용·코드당 5회 시도이며 해시만 저장한다.
 * 요청은 1분 간격으로만 메일을 보낸다. 앱에서 딥링크 없이 쓰기 위해 링크 대신 코드를 쓴다.
 */
@Service
public class PasswordResetService {

    static final Duration CODE_TTL = Duration.ofMinutes(30);
    static final Duration REQUEST_COOLDOWN = Duration.ofMinutes(1);
    private static final int CODE_LENGTH = 6;

    private final PasswordResetTokenRepository tokens;
    private final UserService userService;
    private final AuthMailer mailer;
    private final TokenHasher hasher;
    private final Clock clock;

    public PasswordResetService(PasswordResetTokenRepository tokens, UserService userService, AuthMailer mailer,
                                TokenHasher hasher, Clock clock) {
        this.tokens = tokens;
        this.userService = userService;
        this.mailer = mailer;
        this.hasher = hasher;
        this.clock = clock;
    }

    @Transactional
    public void request(String email) {
        userService.findByEmail(email)
                .filter(User::canSignIn)
                .filter(this::cooldownPassed)
                .ifPresent(user -> {
                    Instant now = clock.instant();
                    String code = hasher.randomDigits(CODE_LENGTH);
                    tokens.save(new PasswordResetToken(user.getId(), hash(user.getId(), code), now.plus(CODE_TTL), now));
                    mailer.sendPasswordResetCode(user.getEmail(), code);
                });
    }

    /** 코드를 확인하고 비밀번호를 바꾼다. 실패 횟수는 예외가 나도 커밋한다. */
    @Transactional(noRollbackFor = ApiException.class)
    public void confirm(String email, String code, String newPassword) {
        User user = userService.findByEmail(email)
                .filter(User::canSignIn)
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_RESET_CODE));
        Instant now = clock.instant();
        PasswordResetToken resetToken = tokens.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .filter(t -> t.isUsable(now))
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_RESET_CODE));
        if (!hasher.matches(user.getId() + ":" + code, resetToken.getCodeHash())) {
            resetToken.recordFailure(now);
            throw new ApiException(ErrorCode.INVALID_RESET_CODE);
        }
        userService.resetPassword(user.getId(), newPassword);
        resetToken.consume(now);
    }

    private boolean cooldownPassed(User user) {
        return tokens.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .map(t -> !t.getCreatedAt().plus(REQUEST_COOLDOWN).isAfter(clock.instant()))
                .orElse(true);
    }

    private String hash(UUID userId, String code) {
        return hasher.hmac(userId + ":" + code);
    }
}
