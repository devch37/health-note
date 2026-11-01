package kr.gumjin.note.global.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Service;

/**
 * 세션 기반 로그인 상태를 만들고 없앤다(docs/SECURITY.md §2).
 */
@Service
public class SessionAuthService {

    static final String SIGNED_IN_AT = "gn.signedInAt";
    static final String CHANNEL = "gn.channel";

    private final SecurityContextRepository securityContextRepository;
    private final FindByIndexNameSessionRepository<? extends Session> sessions;
    private final Clock clock;

    public SessionAuthService(SecurityContextRepository securityContextRepository,
                              FindByIndexNameSessionRepository<? extends Session> sessions, Clock clock) {
        this.securityContextRepository = securityContextRepository;
        this.sessions = sessions;
        this.clock = clock;
    }

    /**
     * 로그인 처리. 기존 세션이 있으면 ID를 재발급해 세션 고정 공격을 막는다.
     * 세션 수명은 요청한 클라이언트 종류(웹·앱)에 따른다.
     */
    public void signIn(UUID userId, boolean emailVerified, HttpServletRequest request, HttpServletResponse response) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(Authorities.USER));
        if (emailVerified) {
            authorities.add(new SimpleGrantedAuthority(Authorities.EMAIL_VERIFIED));
        }
        var principal = new AuthenticatedUser(userId, emailVerified);
        var authentication = UsernamePasswordAuthenticationToken.authenticated(principal, null, authorities);

        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        ClientChannel channel = ClientChannel.of(request);
        HttpSession session = request.getSession();
        session.setMaxInactiveInterval((int) channel.idleTimeout().toSeconds());
        session.setAttribute(SIGNED_IN_AT, clock.instant().toEpochMilli());
        session.setAttribute(CHANNEL, channel.name());
    }

    /** 현재 요청의 세션만 끝낸다. */
    public void signOut(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    /** 사용자의 모든 세션을 삭제한다(탈퇴, 비밀번호 재설정). */
    public void signOutEverywhere(UUID userId) {
        sessions.findByPrincipalName(userId.toString()).keySet().forEach(sessions::deleteById);
    }

    /** 현재 세션을 제외한 나머지 세션을 삭제한다(비밀번호 변경). */
    public void signOutOtherSessions(UUID userId, HttpServletRequest request) {
        HttpSession current = request.getSession(false);
        String currentId = current == null ? null : current.getId();
        sessions.findByPrincipalName(userId.toString()).keySet().stream()
                .filter(id -> !id.equals(currentId))
                .forEach(sessions::deleteById);
    }
}
