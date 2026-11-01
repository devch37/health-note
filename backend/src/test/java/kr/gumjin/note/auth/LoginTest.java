package kr.gumjin.note.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static kr.gumjin.note.support.IntegrationTest.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import kr.gumjin.note.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

class LoginTest extends IntegrationTest {

    private static final String EMAIL = "login@example.com";

    @Test
    void 로그인하면_세션으로_내_정보를_조회할_수_있다() throws Exception {
        signupAndVerify(EMAIL);

        MvcResult result = login(EMAIL, PASSWORD);
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(result.getResponse().getContentAsString()).contains("\"emailVerified\":true");

        assertThat(meStatus(sessionCookie(result))).isEqualTo(200);
    }

    @Test
    void 이미_세션이_있으면_로그인할_때_세션_ID를_새로_발급한다() throws Exception {
        Cookie before = signupAndVerify(EMAIL);

        MvcResult result = mvc.perform(postJson("/api/v1/auth/login", """
                        {"email":"%s","password":"%s"}""".formatted(EMAIL, PASSWORD)).cookie(before))
                .andExpect(status().isOk())
                .andReturn();

        Cookie after = sessionCookie(result);
        assertThat(after.getValue()).isNotEqualTo(before.getValue());
        assertThat(meStatus(before)).isEqualTo(401);
        assertThat(meStatus(after)).isEqualTo(200);
    }

    @Test
    void 틀린_비밀번호와_없는_이메일은_같은_오류로_응답한다() throws Exception {
        signupAndVerify(EMAIL);

        MvcResult wrongPassword = login(EMAIL, "wrong-password-123");
        MvcResult unknownEmail = login("nobody@example.com", "wrong-password-123");

        assertThat(wrongPassword.getResponse().getStatus()).isEqualTo(401);
        assertThat(unknownEmail.getResponse().getStatus()).isEqualTo(401);
        assertThat(wrongPassword.getResponse().getContentAsString()).contains("\"code\":\"INVALID_CREDENTIALS\"");
        assertThat(unknownEmail.getResponse().getContentAsString()).contains("\"code\":\"INVALID_CREDENTIALS\"");
        assertThat(wrongPassword.getResponse().getCookie(SESSION_COOKIE)).isNull();
    }

    @Test
    void 이메일_기준_5회_실패하면_올바른_비밀번호도_잠시_거부한다() throws Exception {
        signupAndVerify(EMAIL);
        for (int i = 0; i < 5; i++) {
            assertThat(login(EMAIL, "wrong-password-123").getResponse().getStatus()).isEqualTo(401);
        }

        mvc.perform(postJson("/api/v1/auth/login", """
                        {"email":"%s","password":"%s"}""".formatted(EMAIL, PASSWORD)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("LOGIN_TEMPORARILY_LOCKED"))
                .andExpect(header().exists("Retry-After"));

        // 잠금 기간이 지나면 다시 로그인할 수 있다.
        jdbc.update("UPDATE login_attempts SET attempted_at = attempted_at - interval '16 minutes'");
        assertThat(login(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void 성공한_로그인_이후의_실패만_잠금_횟수에_포함한다() throws Exception {
        signupAndVerify(EMAIL);
        for (int i = 0; i < 4; i++) {
            login(EMAIL, "wrong-password-123");
        }
        loginOk(EMAIL, PASSWORD);
        for (int i = 0; i < 4; i++) {
            login(EMAIL, "wrong-password-123");
        }
        assertThat(login(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void 로그아웃하면_세션이_무효화된다() throws Exception {
        signupAndVerify(EMAIL);
        Cookie session = loginOk(EMAIL, PASSWORD);

        mvc.perform(post("/api/v1/auth/logout").with(csrf()).cookie(session))
                .andExpect(status().isNoContent());

        assertThat(meStatus(session)).isEqualTo(401);
    }

    @Test
    void 미인증_계정은_로그인은_되지만_건강정보_API는_403이다() throws Exception {
        signup(EMAIL);
        Cookie session = loginOk(EMAIL, PASSWORD);

        mvc.perform(get("/api/v1/users/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerified").value(false));
        mvc.perform(get("/api/v1/test-only/protected").cookie(session))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    void 인증된_계정은_건강정보_API에_접근할_수_있다() throws Exception {
        Cookie session = signupAndVerify(EMAIL);

        mvc.perform(get("/api/v1/test-only/protected").cookie(session))
                .andExpect(status().isOk());
    }
}
