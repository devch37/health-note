package kr.gumjin.note.global;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import kr.gumjin.note.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class SecurityTest extends IntegrationTest {

    @Test
    void CSRF_토큰_없는_상태변경_요청은_403이다() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@example.com\",\"password\":\"whatever-123\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
    }

    @Test
    void CSRF_쿠키_값을_헤더로_보내면_통과한다() throws Exception {
        MvcResult csrf = mvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
                .andReturn();
        Cookie xsrf = csrf.getResponse().getCookie("XSRF-TOKEN");
        assertThat(xsrf).isNotNull();
        // 익명 요청에는 세션을 만들지 않는다.
        assertThat(csrf.getResponse().getCookie(SESSION_COOKIE)).isNull();

        mvc.perform(post("/api/v1/auth/login").cookie(xsrf).header("X-XSRF-TOKEN", xsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@example.com\",\"password\":\"whatever-123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void 세션_쿠키는_HttpOnly_Secure_SameSite_Lax이다() throws Exception {
        signup("cookie@example.com");
        MvcResult result = login("cookie@example.com", PASSWORD);

        String setCookie = result.getResponse().getHeaders("Set-Cookie").stream()
                .filter(h -> h.startsWith(SESSION_COOKIE + "="))
                .findFirst()
                .orElseThrow();
        assertThat(setCookie).contains("HttpOnly").contains("Secure").contains("SameSite=Lax");
    }

    @Test
    void 보안_헤더를_내려준다() throws Exception {
        mvc.perform(get("/api/v1/users/me"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"))
                .andExpect(header().exists("X-Trace-Id"));
    }

    @Test
    void 정의되지_않은_경로는_익명에게_401이다() throws Exception {
        mvc.perform(get("/internal/anything")).andExpect(status().isUnauthorized());
    }

    @Test
    void 기본_설정은_다른_출처의_CORS_요청을_허용하지_않는다() throws Exception {
        mvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "http://localhost:8081")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,x-client"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void 헬스체크는_인증없이_열려있다() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
