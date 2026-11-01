package kr.gumjin.note.user.repository;

import java.util.List;
import java.util.UUID;
import kr.gumjin.note.user.domain.UserConsent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentRepository extends JpaRepository<UserConsent, UUID> {

    List<UserConsent> findByUserId(UUID userId);
}
