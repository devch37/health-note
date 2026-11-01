package kr.gumjin.note.auth.repository;

import java.util.Optional;
import java.util.UUID;
import kr.gumjin.note.auth.domain.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, UUID> {

    Optional<EmailVerification> findTopByUserIdOrderByCreatedAtDesc(UUID userId);
}
