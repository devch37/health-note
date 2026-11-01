package kr.gumjin.note.global.security;

import java.io.Serializable;
import java.util.UUID;
import org.springframework.security.core.AuthenticatedPrincipal;

/**
 * 세션에 저장되는 인증 주체. 이메일 등 개인정보는 넣지 않는다.
 * getName()은 사용자 ID이며 Spring Session의 principal 인덱스로 쓰인다.
 */
public record AuthenticatedUser(UUID id, boolean emailVerified) implements AuthenticatedPrincipal, Serializable {

    @Override
    public String getName() {
        return id.toString();
    }
}
