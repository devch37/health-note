package kr.gumjin.note.global.security;

import java.util.List;
import java.util.Map;
import kr.gumjin.note.global.config.AppProperties;
import org.springframework.security.config.Customizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   SecurityContextRepository securityContextRepository,
                                                   ProblemSecurityHandlers problemHandlers) throws Exception {
        http
                // 쿠키(XSRF-TOKEN) 값을 X-XSRF-TOKEN 헤더로 돌려보내는 방식(double-submit).
                // 토큰을 세션에 두지 않으므로 익명 방문자에게 세션을 만들지 않는다.
                // 앱 요청은 쿠키를 쓰지 않으므로(헤더 세션) 브라우저 CSRF 대상이 아니다.
                .csrf(csrf -> csrf
                        .requireCsrfProtectionMatcher(request -> CsrfFilter.DEFAULT_CSRF_MATCHER.matches(request)
                                && ClientChannel.of(request) == ClientChannel.WEB)
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .cors(Customizer.withDefaults())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .securityContext(sc -> sc.securityContextRepository(securityContextRepository))
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/v3/api-docs", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // 계정 관리는 이메일 미인증 상태에서도 허용(탈퇴·로그아웃 등)
                        .requestMatchers("/api/v1/users/me", "/api/v1/users/me/password").authenticated()
                        // 그 외 모든 API(건강정보 포함)는 이메일 인증 완료 계정만
                        .requestMatchers("/api/v1/**").hasAuthority(Authorities.EMAIL_VERIFIED)
                        .anyRequest().denyAll())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(problemHandlers)
                        .accessDeniedHandler(problemHandlers));
        return http.build();
    }

    /**
     * 기본은 어떤 출처도 허용하지 않는다. local 프로필에서만 Expo 웹 미리보기 출처를 허용하며,
     * 쿠키를 싣지 않는 헤더 세션(앱 방식)만 쓰도록 자격증명은 허용하지 않는다.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(AppProperties properties) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(properties.corsAllowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("Accept", "Content-Type", ClientChannel.CLIENT_HEADER, ClientChannel.AUTH_TOKEN_HEADER));
        config.setExposedHeaders(List.of(ClientChannel.AUTH_TOKEN_HEADER, "Retry-After", "X-Trace-Id"));
        config.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        String defaultId = "argon2";
        return new DelegatingPasswordEncoder(defaultId, Map.of(
                defaultId, Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8(),
                "bcrypt", new BCryptPasswordEncoder()));
    }
}
