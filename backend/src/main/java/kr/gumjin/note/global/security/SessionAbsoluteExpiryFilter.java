package kr.gumjin.note.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 로그인 후 절대 수명이 지난 세션을 끝낸다. 유휴 만료는 Spring Session이 처리한다.
 * 로그인 시각이 없는 세션은 이 서비스가 만든 로그인 세션이 아니므로 끝낸다.
 */
public class SessionAbsoluteExpiryFilter extends OncePerRequestFilter {

    private final Clock clock;

    public SessionAbsoluteExpiryFilter(Clock clock) {
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session != null && isExpired(session)) {
            session.invalidate();
        }
        chain.doFilter(request, response);
    }

    private boolean isExpired(HttpSession session) {
        if (!(session.getAttribute(SessionAuthService.SIGNED_IN_AT) instanceof Long signedInAt)
                || !(session.getAttribute(SessionAuthService.CHANNEL) instanceof String channelName)) {
            return true;
        }
        ClientChannel channel;
        try {
            channel = ClientChannel.valueOf(channelName);
        } catch (IllegalArgumentException e) {
            return true;
        }
        Instant deadline = Instant.ofEpochMilli(signedInAt).plus(channel.absoluteTimeout());
        return !clock.instant().isBefore(deadline);
    }
}
