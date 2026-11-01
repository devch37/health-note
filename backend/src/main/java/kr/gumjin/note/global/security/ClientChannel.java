package kr.gumjin.note.global.security;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;

/**
 * 세션을 전달하는 클라이언트 종류와 종류별 세션 수명(docs/SECURITY.md §2, ADR-10).
 * 앱은 세션 ID를 X-Auth-Token 헤더로, 웹은 GN_SESSION 쿠키로 주고받는다.
 */
public enum ClientChannel {

    WEB(Duration.ofMinutes(30), Duration.ofDays(7)),
    APP(Duration.ofDays(30), Duration.ofDays(90));

    public static final String AUTH_TOKEN_HEADER = "X-Auth-Token";
    public static final String CLIENT_HEADER = "X-Client";

    private final Duration idleTimeout;
    private final Duration absoluteTimeout;

    ClientChannel(Duration idleTimeout, Duration absoluteTimeout) {
        this.idleTimeout = idleTimeout;
        this.absoluteTimeout = absoluteTimeout;
    }

    /**
     * 헤더 토큰이 있거나 앱임을 밝힌 요청은 APP. 브라우저는 다른 출처에서 사용자 지정 헤더를
     * 붙일 수 없으므로(CORS 미허용) 이 판별을 CSRF 면제 근거로 쓸 수 있다.
     */
    public static ClientChannel of(HttpServletRequest request) {
        if (request.getHeader(AUTH_TOKEN_HEADER) != null || "app".equalsIgnoreCase(request.getHeader(CLIENT_HEADER))) {
            return APP;
        }
        return WEB;
    }

    public Duration idleTimeout() {
        return idleTimeout;
    }

    public Duration absoluteTimeout() {
        return absoluteTimeout;
    }
}
