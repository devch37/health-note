package kr.gumjin.note.user.service;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import kr.gumjin.note.global.error.ApiException;
import kr.gumjin.note.global.error.ErrorCode;
import kr.gumjin.note.global.security.SessionAuthService;
import kr.gumjin.note.user.domain.ConsentPolicy;
import kr.gumjin.note.user.domain.ConsentType;
import kr.gumjin.note.user.domain.User;
import kr.gumjin.note.user.domain.UserConsent;
import kr.gumjin.note.user.repository.UserConsentRepository;
import kr.gumjin.note.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * user 모듈의 공개 API. 다른 모듈은 UserRepository 대신 이 서비스를 사용한다.
 */
@Service
public class UserService {

    public static final String WITHDRAWAL_CONFIRM_TEXT = "탈퇴";

    private final UserRepository users;
    private final UserConsentRepository consents;
    private final PasswordEncoder passwordEncoder;
    private final SessionAuthService sessionAuthService;
    private final Clock clock;

    public UserService(UserRepository users, UserConsentRepository consents, PasswordEncoder passwordEncoder,
                       SessionAuthService sessionAuthService, Clock clock) {
        this.users = users;
        this.consents = consents;
        this.passwordEncoder = passwordEncoder;
        this.sessionAuthService = sessionAuthService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return users.findByEmailAndDeletedAtIsNull(Emails.normalize(email));
    }

    @Transactional(readOnly = true)
    public UserView view(UUID userId) {
        return UserView.from(getActive(userId));
    }

    /** 새 계정 생성 + 동의 이력 저장. 필수 동의가 현재 버전으로 모두 있어야 한다. */
    @Transactional
    public User register(String email, String rawPassword, List<ConsentAgreement> agreements) {
        String normalized = Emails.normalize(email);
        PasswordPolicy.check("password", rawPassword, normalized);
        requireConsents(agreements);

        Instant now = clock.instant();
        User user = users.save(User.register(normalized, passwordEncoder.encode(rawPassword), now));
        for (ConsentAgreement agreement : agreements) {
            consents.save(new UserConsent(user.getId(), agreement.type(), agreement.version(), now));
        }
        return user;
    }

    @Transactional
    public void markEmailVerified(UUID userId) {
        getActive(userId).markEmailVerified(clock.instant());
    }

    /** 비밀번호 재설정 메일로 이메일 소유가 확인된 경우. 미인증 계정은 인증 완료로 바뀐다. */
    @Transactional
    public void resetPassword(UUID userId, String newRawPassword) {
        User user = getActive(userId);
        PasswordPolicy.check("newPassword", newRawPassword, user.getEmail());
        Instant now = clock.instant();
        user.changePasswordHash(passwordEncoder.encode(newRawPassword), now);
        user.markEmailVerified(now);
        sessionAuthService.signOutEverywhere(userId);
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword, HttpServletRequest request) {
        User user = getActive(userId);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_PASSWORD);
        }
        PasswordPolicy.check("newPassword", newPassword, user.getEmail());
        user.changePasswordHash(passwordEncoder.encode(newPassword), clock.instant());
        sessionAuthService.signOutOtherSessions(userId, request);
    }

    /**
     * 탈퇴. Sprint 1에서는 계정만 처리한다. 건강정보·파일 파기는 해당 모듈이 생기는 Sprint에서 연결한다.
     * 동의 이력 보관 여부는 법률 검토 대상이라 현재는 남겨둔다(docs/SECURITY.md §8-8).
     */
    @Transactional
    public void withdraw(UUID userId, String password, String confirmText) {
        User user = getActive(userId);
        if (!WITHDRAWAL_CONFIRM_TEXT.equals(confirmText)) {
            throw new ApiException(ErrorCode.WITHDRAWAL_CONFIRMATION_MISMATCH);
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(ErrorCode.INVALID_PASSWORD);
        }
        user.withdraw(clock.instant());
        users.flush();
        sessionAuthService.signOutEverywhere(userId);
    }

    private User getActive(UUID userId) {
        return users.findByIdAndDeletedAtIsNull(userId)
                .filter(User::canSignIn)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED));
    }

    /** 필수 동의가 현재 버전으로 모두 포함됐는지 확인한다. 중복·구버전은 거부한다. */
    public static void requireConsents(List<ConsentAgreement> agreements) {
        Set<ConsentType> agreed = EnumSet.noneOf(ConsentType.class);
        for (ConsentAgreement agreement : agreements) {
            if (!ConsentPolicy.CURRENT_VERSIONS.get(agreement.type()).equals(agreement.version())
                    || !agreed.add(agreement.type())) {
                throw new ApiException(ErrorCode.REQUIRED_CONSENT_MISSING);
            }
        }
        if (!agreed.containsAll(ConsentType.REQUIRED)) {
            throw new ApiException(ErrorCode.REQUIRED_CONSENT_MISSING);
        }
    }
}
