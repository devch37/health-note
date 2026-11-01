package kr.gumjin.note.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import kr.gumjin.note.global.persistence.BaseEntity;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false, columnDefinition = "citext")
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    protected User() {
    }

    public static User register(String normalizedEmail, String passwordHash, Instant now) {
        User user = new User();
        user.email = normalizedEmail;
        user.passwordHash = passwordHash;
        user.status = UserStatus.PENDING_VERIFICATION;
        user.createdAt = now;
        user.updatedAt = now;
        return user;
    }

    public void markEmailVerified(Instant now) {
        if (status == UserStatus.PENDING_VERIFICATION) {
            status = UserStatus.ACTIVE;
            emailVerifiedAt = now;
            updatedAt = now;
        }
    }

    public void changePasswordHash(String newHash, Instant now) {
        passwordHash = newHash;
        updatedAt = now;
    }

    /** 탈퇴: 이메일을 식별 불가능한 값으로 바꾸고 비밀번호 해시를 제거한다. 같은 이메일로 재가입할 수 있다. */
    public void withdraw(Instant now) {
        email = "withdrawn+" + getId() + "@invalid";
        passwordHash = "!";
        status = UserStatus.WITHDRAWN;
        deletedAt = now;
        updatedAt = now;
    }

    public boolean isEmailVerified() {
        return status == UserStatus.ACTIVE;
    }

    public boolean canSignIn() {
        return deletedAt == null && (status == UserStatus.ACTIVE || status == UserStatus.PENDING_VERIFICATION);
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public UserStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
