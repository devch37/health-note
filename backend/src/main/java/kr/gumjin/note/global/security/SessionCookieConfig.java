package kr.gumjin.note.global.security;

import java.time.Clock;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.session.web.http.HttpSessionIdResolver;
import org.springframework.session.web.http.SessionRepositoryFilter;

/**
 * 세션 전달 방식(웹 쿠키·앱 헤더)과 쿠키 속성(docs/SECURITY.md §2).
 * Spring Session이 쓰는 쿠키이므로 server.servlet.session.cookie 대신 여기서 정한다.
 */
@Configuration
public class SessionCookieConfig {

    public static final String COOKIE_NAME = "GN_SESSION";

    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName(COOKIE_NAME);
        serializer.setCookiePath("/");
        serializer.setUseHttpOnlyCookie(true);
        // 브라우저는 http://localhost도 보안 컨텍스트로 취급하므로 로컬에서도 Secure를 유지한다.
        serializer.setUseSecureCookie(true);
        serializer.setSameSite("Lax");
        return serializer;
    }

    @Bean
    public HttpSessionIdResolver httpSessionIdResolver(CookieSerializer cookieSerializer) {
        return new ClientAwareSessionIdResolver(cookieSerializer);
    }

    /** 세션을 읽은 직후, Spring Security보다 먼저 실행한다. */
    @Bean
    public FilterRegistrationBean<SessionAbsoluteExpiryFilter> sessionAbsoluteExpiryFilter(Clock clock) {
        var registration = new FilterRegistrationBean<>(new SessionAbsoluteExpiryFilter(clock));
        registration.setOrder(SessionRepositoryFilter.DEFAULT_ORDER + 1);
        return registration;
    }
}
