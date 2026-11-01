package kr.gumjin.note.user.service;

import java.time.Instant;
import java.util.UUID;
import kr.gumjin.note.user.domain.User;
import kr.gumjin.note.user.domain.UserStatus;

/** API 응답용 내 정보(docs/API.md §3 UserMe). */
public record UserView(UUID id, String email, UserStatus status, boolean emailVerified, Instant createdAt) {

    public static UserView from(User user) {
        return new UserView(user.getId(), user.getEmail(), user.getStatus(), user.isEmailVerified(), user.getCreatedAt());
    }
}
