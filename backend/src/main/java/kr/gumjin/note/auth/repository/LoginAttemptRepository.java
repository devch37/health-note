package kr.gumjin.note.auth.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import kr.gumjin.note.auth.domain.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    List<LoginAttempt> findTop5ByEmailHashAndSucceededFalseAndAttemptedAtAfterOrderByAttemptedAtDesc(
            String emailHash, Instant after);

    Optional<LoginAttempt> findTopByEmailHashAndSucceededTrueOrderByAttemptedAtDesc(String emailHash);

    long countByIpHashAndSucceededFalseAndAttemptedAtAfter(String ipHash, Instant after);
}
