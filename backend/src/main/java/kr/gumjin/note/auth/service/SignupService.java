package kr.gumjin.note.auth.service;

import java.util.List;
import java.util.Optional;
import kr.gumjin.note.user.domain.User;
import kr.gumjin.note.user.service.ConsentAgreement;
import kr.gumjin.note.user.service.Emails;
import kr.gumjin.note.user.service.PasswordPolicy;
import kr.gumjin.note.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 가입. 이미 있는 이메일이어도 같은 응답을 주고 메일로만 안내한다(계정 열거 방지).
 */
@Service
public class SignupService {

    private final UserService userService;
    private final EmailVerificationService verificationService;
    private final AuthMailer mailer;

    public SignupService(UserService userService, EmailVerificationService verificationService, AuthMailer mailer) {
        this.userService = userService;
        this.verificationService = verificationService;
        this.mailer = mailer;
    }

    @Transactional
    public void signup(String email, String password, List<ConsentAgreement> consents) {
        // 입력 검증은 기존 계정 여부와 관계없이 먼저 수행해 응답 차이를 없앤다.
        PasswordPolicy.check("password", password, Emails.normalize(email));
        UserService.requireConsents(consents);

        Optional<User> existing = userService.findByEmail(email);
        if (existing.isEmpty()) {
            User user = userService.register(email, password, consents);
            verificationService.issue(user);
            return;
        }
        User user = existing.get();
        if (user.isEmailVerified()) {
            mailer.sendAlreadyRegistered(user.getEmail());
        } else {
            // 미인증 계정의 비밀번호는 바꾸지 않는다(타인이 선점한 경우 비밀번호 재설정으로 회수).
            verificationService.resend(email);
        }
    }
}
