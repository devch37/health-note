package kr.gumjin.note.global;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.time.Duration;
import kr.gumjin.note.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** 앱 클라이언트의 헤더 세션(docs/API.md §1 인증, ADR-10). */
class AppSessionTest extends IntegrationTest {

    private static final String EMAIL = "app@example.com";
    private static final String TOKEN_HEADER = "X-Auth-Token";

    /** 앱은 CSRF 토큰 없이 요청한다. */
    private MockHttpServletRequestBuilder appPost(String url, String body) {
        return post(url).header("X-Client", "app").contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private String appLogin() throws Exception {
        MvcResult result = mvc.perform(appPost("/api/v1/auth/login", """
                        {"email":"%s","password":"%s"}""".formatted(EMAIL, PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getCookie(SESSION_COOKIE)).isNull();
        String token = result.getResponse().getHeader(TOKEN_HEADER);
        assertThat(token).isNotBlank();
        return token;
    }

    private int appMeStatus(String token) throws Exception {
        return mvc.perform(get("/api/v1/users/me").header(TOKEN_HEADER, token)).andReturn().getResponse().getStatus();
    }

    @Test
    void 앱_로그인은_쿠키_대신_헤더로_세션을_주고_CSRF_없이_동작한다() throws Exception {
        signupAndVerify(EMAIL);
        String token = appLogin();

        mvc.perform(get("/api/v1/users/me").header(TOKEN_HEADER, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL));

        mvc.perform(post("/api/v1/auth/logout").header(TOKEN_HEADER, token)).andExpect(status().isNoContent());
        assertThat(appMeStatus(token)).isEqualTo(401);
    }

    @Test
    void 앱_인증코드_확인도_헤더로_세션을_준다() throws Exception {
        signup(EMAIL);
        MvcResult result = mvc.perform(appPost("/api/v1/auth/email-verifications/confirm", """
                        {"email":"%s","code":"%s"}""".formatted(EMAIL, mailer.lastCode(EMAIL))))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getCookie(SESSION_COOKIE)).isNull();
        assertThat(appMeStatus(result.getResponse().getHeader(TOKEN_HEADER))).isEqualTo(200);
    }

    @Test
    void 앱_요청에_실린_웹_세션_쿠키는_무시한다() throws Exception {
        Cookie webSession = signupAndVerify(EMAIL);

        int status = mvc.perform(get("/api/v1/users/me").header("X-Client", "app").cookie(webSession))
                .andReturn().getResponse().getStatus();
        assertThat(status).isEqualTo(401);
    }

    @Test
    void 웹_쿠키_요청은_여전히_CSRF가_필요하다() throws Exception {
        Cookie webSession = signupAndVerify(EMAIL);

        mvc.perform(post("/api/v1/auth/logout").cookie(webSession))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
    }

    @Test
    void 세션_유휴_만료는_앱_30일_웹_30분이다() throws Exception {
        signupAndVerify(EMAIL);
        jdbc.update("DELETE FROM spring_session");
        appLogin();
        loginOk(EMAIL, PASSWORD);

        assertThat(jdbc.queryForList("SELECT max_inactive_interval FROM spring_session ORDER BY max_inactive_interval",
                Integer.class)).containsExactly(1800, 2_592_000);
    }

    @Test
    void 앱_세션은_로그인_90일_후_끝난다() throws Exception {
        signupAndVerify(EMAIL);
        String token = appLogin();

        clock.advance(Duration.ofDays(89));
        assertThat(appMeStatus(token)).isEqualTo(200);
        clock.advance(Duration.ofDays(1));
        assertThat(appMeStatus(token)).isEqualTo(401);
    }

    @Test
    void 웹_세션은_로그인_7일_후_끝난다() throws Exception {
        Cookie session = signupAndVerify(EMAIL);

        clock.advance(Duration.ofDays(7));
        assertThat(meStatus(session)).isEqualTo(401);
    }

    @Test
    void 비밀번호_재설정은_앱_세션도_끊는다() throws Exception {
        signupAndVerify(EMAIL);
        String token = appLogin();
        mvc.perform(postJson("/api/v1/auth/password-reset/request", "{\"email\":\"%s\"}".formatted(EMAIL)));
        mvc.perform(postJson("/api/v1/auth/password-reset/confirm", """
                        {"email":"%s","code":"%s","newPassword":"another-password-9"}"""
                        .formatted(EMAIL, mailer.lastResetCode(EMAIL))))
                .andExpect(status().isNoContent());

        assertThat(appMeStatus(token)).isEqualTo(401);
    }
}
