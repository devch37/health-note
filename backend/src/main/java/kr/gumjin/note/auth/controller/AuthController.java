package kr.gumjin.note.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import kr.gumjin.note.auth.service.EmailVerificationService;
import kr.gumjin.note.auth.service.LoginService;
import kr.gumjin.note.auth.service.PasswordResetService;
import kr.gumjin.note.auth.service.SignupService;
import kr.gumjin.note.global.security.SessionAuthService;
import kr.gumjin.note.user.domain.ConsentType;
import kr.gumjin.note.user.domain.User;
import kr.gumjin.note.user.service.ConsentAgreement;
import kr.gumjin.note.user.service.UserService;
import kr.gumjin.note.user.service.UserView;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final SignupService signupService;
    private final EmailVerificationService verificationService;
    private final LoginService loginService;
    private final PasswordResetService passwordResetService;
    private final SessionAuthService sessionAuthService;
    private final UserService userService;

    public AuthController(SignupService signupService, EmailVerificationService verificationService,
                          LoginService loginService, PasswordResetService passwordResetService,
                          SessionAuthService sessionAuthService, UserService userService) {
        this.signupService = signupService;
        this.verificationService = verificationService;
        this.loginService = loginService;
        this.passwordResetService = passwordResetService;
        this.sessionAuthService = sessionAuthService;
        this.userService = userService;
    }

    /** XSRF-TOKEN 쿠키를 발급한다. 클라이언트는 쿠키 값을 X-XSRF-TOKEN 헤더로 보낸다. */
    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        token.getToken();
        return new CsrfResponse(token.getHeaderName());
    }

    @PostMapping("/signup")
    public ResponseEntity<StatusResponse> signup(@Valid @RequestBody SignupRequest body) {
        List<ConsentAgreement> consents = body.consents().stream()
                .map(c -> new ConsentAgreement(c.type(), c.version()))
                .toList();
        signupService.signup(body.email(), body.password(), consents);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(new StatusResponse("VERIFICATION_REQUIRED"));
    }

    @PostMapping("/email-verifications/confirm")
    public UserResponse confirmEmail(@Valid @RequestBody ConfirmEmailRequest body,
                                     HttpServletRequest request, HttpServletResponse response) {
        UUID userId = verificationService.confirm(body.email(), body.code());
        sessionAuthService.signIn(userId, true, request, response);
        return new UserResponse(userService.view(userId));
    }

    @PostMapping("/email-verifications/resend")
    public ResponseEntity<Void> resendCode(@Valid @RequestBody EmailRequest body) {
        verificationService.resend(body.email());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest body,
                              HttpServletRequest request, HttpServletResponse response) {
        User user = loginService.authenticate(body.email(), body.password(), request.getRemoteAddr());
        sessionAuthService.signIn(user.getId(), user.isEmailVerified(), request, response);
        return new UserResponse(UserView.from(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        sessionAuthService.signOut(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<Void> requestPasswordReset(@Valid @RequestBody EmailRequest body) {
        passwordResetService.request(body.email());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<Void> confirmPasswordReset(@Valid @RequestBody ResetPasswordRequest body) {
        passwordResetService.confirm(body.email(), body.code(), body.newPassword());
        return ResponseEntity.noContent().build();
    }

    public record CsrfResponse(String headerName) {
    }

    public record StatusResponse(String status) {
    }

    public record UserResponse(UserView user) {
    }

    public record ConsentRequest(@NotNull ConsentType type, @NotBlank @Size(max = 32) String version) {
    }

    public record SignupRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 10, max = 128) String password,
            @NotNull @Size(max = 10) List<@Valid @NotNull ConsentRequest> consents) {
    }

    public record ConfirmEmailRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = "\\d{6}") String code) {
    }

    public record EmailRequest(@NotBlank @Email @Size(max = 254) String email) {
    }

    public record LoginRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 128) String password) {
    }

    public record ResetPasswordRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = "\\d{6}") String code,
            @NotBlank @Size(min = 10, max = 128) String newPassword) {
    }
}
