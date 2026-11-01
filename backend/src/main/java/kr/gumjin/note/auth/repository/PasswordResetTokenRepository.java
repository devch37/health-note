package kr.gumjin.note.auth.repository;

import java.util.Optional;
import java.util.UUID;
import kr.gumjin.note.auth.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findTopByUserIdOrderByCreatedAtDesc(UUID userId);
}
