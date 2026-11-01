package kr.gumjin.note.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import kr.gumjin.note.global.persistence.BaseEntity;

@Entity
@Table(name = "user_consents")
public class UserConsent extends BaseEntity {

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false, updatable = false)
    private ConsentType consentType;

    @Column(nullable = false, updatable = false)
    private String version;

    @Column(name = "agreed_at", nullable = false, updatable = false)
    private Instant agreedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    protected UserConsent() {
    }

    public UserConsent(UUID userId, ConsentType consentType, String version, Instant agreedAt) {
        this.userId = userId;
        this.consentType = consentType;
        this.version = version;
        this.agreedAt = agreedAt;
    }

    public ConsentType getConsentType() {
        return consentType;
    }

    public String getVersion() {
        return version;
    }
}
