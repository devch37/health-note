package kr.gumjin.note.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import kr.gumjin.note.global.persistence.BaseEntity;

@Entity
@Table(name = "email_verifications")
public class EmailVerification extends BaseEntity {

    public static final int MAX_ATTEMPTS = 5;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    /** 인증코드의 HMAC. 원문은 저장하지 않는다. */
    @Column(name = "code_hash", nullable = false, updatable = false)
    private String codeHash;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected EmailVerification() {
    }

    public EmailVerification(UUID userId, String codeHash, Instant expiresAt, Instant now) {
        this.userId = userId;
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
        this.createdAt = now;
    }

    public boolean isUsable(Instant now) {
        return consumedAt == null && attemptCount < MAX_ATTEMPTS && now.isBefore(expiresAt);
    }

    /** 실패 1회 기록. 한도에 도달하면 코드를 무효화한다. */
    public void recordFailure(Instant now) {
        attemptCount++;
        if (attemptCount >= MAX_ATTEMPTS) {
            consumedAt = now;
        }
    }

    public void consume(Instant now) {
        consumedAt = now;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getCodeHash() {
        return codeHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
