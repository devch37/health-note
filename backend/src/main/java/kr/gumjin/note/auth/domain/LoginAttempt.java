package kr.gumjin.note.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** 로그인 시도 기록. 이메일·IP는 HMAC으로만 저장한다. */
@Entity
@Table(name = "login_attempts")
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email_hash", nullable = false, updatable = false)
    private String emailHash;

    @Column(name = "ip_hash", nullable = false, updatable = false)
    private String ipHash;

    @Column(nullable = false, updatable = false)
    private boolean succeeded;

    @Column(name = "attempted_at", nullable = false, updatable = false)
    private Instant attemptedAt;

    protected LoginAttempt() {
    }

    public LoginAttempt(String emailHash, String ipHash, boolean succeeded, Instant attemptedAt) {
        this.emailHash = emailHash;
        this.ipHash = ipHash;
        this.succeeded = succeeded;
        this.attemptedAt = attemptedAt;
    }

    public Instant getAttemptedAt() {
        return attemptedAt;
    }
}
