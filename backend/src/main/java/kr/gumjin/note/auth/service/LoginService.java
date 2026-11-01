package kr.gumjin.note.auth.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import kr.gumjin.note.auth.domain.LoginAttempt;
import kr.gumjin.note.auth.repository.LoginAttemptRepository;
import kr.gumjin.note.global.crypto.TokenHasher;
import kr.gumjin.note.global.error.ApiException;
import kr.gumjin.note.global.error.ErrorCode;
import kr.gumjin.note.user.domain.User;
import kr.gumjin.note.user.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 비밀번호 확인과 로그인 시도 제한(docs/SECURITY.md §2).
 * 이메일 기준 15분 내 5회 실패 시 잠금, IP 기준 1시간 내 50회 실패 시 잠금.
 */
@Service
public class LoginService {

    static final int EMAIL_MAX_FAILURES = 5;
    static final Duration EMAIL_WINDOW = Duration.ofMinutes(15);
    static final int IP_MAX_FAILURES = 50;
    static final Duration IP_WINDOW = Duration.ofHours(1);

    private final UserService userService;
    private final LoginAttemptRepository attempts;
    private final PasswordEncoder passwordEncoder;
    private final TokenHasher hasher;
    private final Clock clock;
    /** 없는 계정에도 같은 비용의 해시 비교를 수행해 응답 시간 차이를 줄인다. */
    private final String dummyHash;

    public LoginService(UserService userService, LoginAttemptRepository attempts, PasswordEncoder passwordEncoder,
                        TokenHasher hasher, Clock clock) {
        this.userService = userService;
        this.attempts = attempts;
        this.passwordEncoder = passwordEncoder;
        this.hasher = hasher;
        this.clock = clock;
        this.dummyHash = passwordEncoder.encode(hasher.randomUrlToken(16));
    }

    @Transactional(noRollbackFor = ApiException.class)
    public User authenticate(String email, String password, String clientIp) {
        Instant now = clock.instant();
        String emailHash = hasher.hmacNormalized(email);
        String ipHash = hasher.hmac(clientIp);
        checkNotLocked(emailHash, ipHash, now);

        Optional<User> user = userService.findByEmail(email).filter(User::canSignIn);
        boolean matched = passwordEncoder.matches(password, user.map(User::getPasswordHash).orElse(dummyHash))
                && user.isPresent();

        attempts.save(new LoginAttempt(emailHash, ipHash, matched, now));
        if (!matched) {
            throw new ApiException(ErrorCode.INVALID_CREDENTIALS);
        }
        return user.get();
    }

    private void checkNotLocked(String emailHash, String ipHash, Instant now) {
        Instant since = now.minus(EMAIL_WINDOW);
        Optional<Instant> lastSuccess = attempts.findTopByEmailHashAndSucceededTrueOrderByAttemptedAtDesc(emailHash)
                .map(LoginAttempt::getAttemptedAt);
        if (lastSuccess.isPresent() && lastSuccess.get().isAfter(since)) {
            since = lastSuccess.get();
        }
        List<LoginAttempt> recentFailures =
                attempts.findTop5ByEmailHashAndSucceededFalseAndAttemptedAtAfterOrderByAttemptedAtDesc(emailHash, since);
        if (recentFailures.size() >= EMAIL_MAX_FAILURES) {
            Instant unlockAt = recentFailures.get(EMAIL_MAX_FAILURES - 1).getAttemptedAt().plus(EMAIL_WINDOW);
            throw new ApiException(ErrorCode.LOGIN_TEMPORARILY_LOCKED, Duration.between(now, unlockAt));
        }
        if (attempts.countByIpHashAndSucceededFalseAndAttemptedAtAfter(ipHash, now.minus(IP_WINDOW)) >= IP_MAX_FAILURES) {
            throw new ApiException(ErrorCode.LOGIN_TEMPORARILY_LOCKED, EMAIL_WINDOW);
        }
    }
}
