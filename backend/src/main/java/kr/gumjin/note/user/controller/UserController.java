package kr.gumjin.note.user.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import kr.gumjin.note.global.security.AuthenticatedUser;
import kr.gumjin.note.user.service.UserService;
import kr.gumjin.note.user.service.UserView;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserView me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return userService.view(principal.id());
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AuthenticatedUser principal,
                                               @Valid @RequestBody ChangePasswordRequest body,
                                               HttpServletRequest request) {
        userService.changePassword(principal.id(), body.currentPassword(), body.newPassword(), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> withdraw(@AuthenticationPrincipal AuthenticatedUser principal,
                                         @Valid @RequestBody WithdrawRequest body,
                                         HttpServletRequest request) {
        userService.withdraw(principal.id(), body.password(), body.confirmText());
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    public record ChangePasswordRequest(
            @NotBlank @Size(max = 128) String currentPassword,
            @NotBlank @Size(min = 10, max = 128) String newPassword) {
    }

    public record WithdrawRequest(
            @NotBlank @Size(max = 128) String password,
            @NotBlank String confirmText) {
    }
}
