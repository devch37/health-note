package kr.gumjin.note.auth.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import kr.gumjin.note.auth.domain.EmailVerification;
import kr.gumjin.note.auth.repository.EmailVerificationRepository;
import kr.gumjin.note.global.crypto.TokenHasher;
import kr.gumjin.note.global.error.ApiException;
import kr.gumjin.note.global.error.ErrorCode;
import kr.gumjin.note.user.domain.User;
import kr.gumjin.note.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 6자리 이메일 인증코드 발급·확인. 10분 유효, 코드당 5회 시도, 재발송 1분 간격.
 */
@Service
public class EmailVerificationService {

    static final Duration CODE_TTL = Duration.ofMinutes(10);
    static final Duration RESEND_COOLDOWN = Duration.ofMinutes(1);
    private static final int CODE_LENGTH = 6;

    private final EmailVerificationRepository verifications;
    private final UserService userService;
    private final AuthMailer mailer;
    private final TokenHasher hasher;
    private final Clock clock;

    public EmailVerificationService(EmailVerificationRepository verifications, UserService userService,
                                    AuthMailer mailer, TokenHasher hasher, Clock clock) {
        this.verifications = verifications;
        this.userService = userService;
        this.mailer = mailer;
        this.hasher = hasher;
        this.clock = clock;
    }

    @Transactional
    public void issue(User user) {
        Instant now = clock.instant();
        String code = hasher.randomDigits(CODE_LENGTH);
        verifications.save(new EmailVerification(user.getId(), hash(user.getId(), code), now.plus(CODE_TTL), now));
        mailer.sendVerificationCode(user.getEmail(), code);
    }

    /** 미인증 계정이면 새 코드를 보낸다. 계정 존재 여부를 노출하지 않도록 결과를 반환하지 않는다. */
    @Transactional
    public void resend(String email) {
        userService.findByEmail(email)
                .filter(user -> user.canSignIn() && !user.isEmailVerified())
                .filter(this::cooldownPassed)
                .ifPresent(this::issue);
    }

    /** 코드를 확인하고 계정을 인증 완료로 바꾼다. 실패 횟수는 예외가 나도 커밋한다. */
    @Transactional(noRollbackFor = ApiException.class)
    public UUID confirm(String email, String code) {
        User user = userService.findByEmail(email)
                .filter(u -> u.canSignIn() && !u.isEmailVerified())
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_VERIFICATION_CODE));
        Instant now = clock.instant();
        EmailVerification verification = verifications.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .filter(v -> v.isUsable(now))
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_VERIFICATION_CODE));
        if (!hasher.matches(user.getId() + ":" + code, verification.getCodeHash())) {
            verification.recordFailure(now);
            throw new ApiException(ErrorCode.INVALID_VERIFICATION_CODE);
        }
        verification.consume(now);
        userService.markEmailVerified(user.getId());
        return user.getId();
    }

    private boolean cooldownPassed(User user) {
        return verifications.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .map(v -> !v.getCreatedAt().plus(RESEND_COOLDOWN).isAfter(clock.instant()))
                .orElse(true);
    }

    private String hash(UUID userId, String code) {
        return hasher.hmac(userId + ":" + code);
    }
}
