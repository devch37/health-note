package kr.gumjin.note.global.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.session.web.http.CookieHttpSessionIdResolver;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.HeaderHttpSessionIdResolver;
import org.springframework.session.web.http.HttpSessionIdResolver;

/** 앱 요청은 X-Auth-Token 헤더, 그 외는 쿠키로 세션 ID를 읽고 쓴다. 앱 요청에 실린 쿠키는 무시한다. */
public class ClientAwareSessionIdResolver implements HttpSessionIdResolver {

    private final HttpSessionIdResolver header = new HeaderHttpSessionIdResolver(ClientChannel.AUTH_TOKEN_HEADER);
    private final CookieHttpSessionIdResolver cookie = new CookieHttpSessionIdResolver();

    public ClientAwareSessionIdResolver(CookieSerializer cookieSerializer) {
        cookie.setCookieSerializer(cookieSerializer);
    }

    @Override
    public List<String> resolveSessionIds(HttpServletRequest request) {
        return delegate(request).resolveSessionIds(request);
    }

    @Override
    public void setSessionId(HttpServletRequest request, HttpServletResponse response, String sessionId) {
        delegate(request).setSessionId(request, response, sessionId);
    }

    @Override
    public void expireSession(HttpServletRequest request, HttpServletResponse response) {
        delegate(request).expireSession(request, response);
    }

    private HttpSessionIdResolver delegate(HttpServletRequest request) {
        return ClientChannel.of(request) == ClientChannel.APP ? header : cookie;
    }
}
