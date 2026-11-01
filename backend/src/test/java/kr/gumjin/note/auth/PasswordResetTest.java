package kr.gumjin.note.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import kr.gumjin.note.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

class PasswordResetTest extends IntegrationTest {

    private static final String EMAIL = "reset@example.com";
    private static final String NEW_PASSWORD = "brand-new-password-1";

    private void requestReset(String email) throws Exception {
        mvc.perform(postJson("/api/v1/auth/password-reset/request", "{\"email\":\"%s\"}".formatted(email)))
                .andExpect(status().isAccepted());
    }

    private ResultActions confirm(String email, String code) throws Exception {
        return mvc.perform(postJson("/api/v1/auth/password-reset/confirm", """
                {"email":"%s","code":"%s","newPassword":"%s"}""".formatted(email, code, NEW_PASSWORD)));
    }

    private static String wrongCode(String code) {
        return code.equals("000000") ? "111111" : "000000";
    }

    @Test
    void 없는_이메일도_202를_반환하고_메일을_보내지_않는다() throws Exception {
        requestReset("nobody@example.com");
        assertThat(mailer.all()).isEmpty();
    }

    @Test
    void 재설정하면_새_비밀번호로만_로그인되고_기존_세션은_끊긴다() throws Exception {
        Cookie oldSession = signupAndVerify(EMAIL);
        requestReset(EMAIL);
        String code = mailer.lastResetCode(EMAIL);
        assertThat(code).matches("\\d{6}");
        assertThat(jdbc.queryForObject("SELECT token_hash FROM password_reset_tokens", String.class)).doesNotContain(code);

        confirm(EMAIL, code).andExpect(status().isNoContent());

        assertThat(meStatus(oldSession)).isEqualTo(401);
        assertThat(login(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(401);
        assertThat(login(EMAIL, NEW_PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void 코드는_한_번만_쓸_수_있다() throws Exception {
        signupAndVerify(EMAIL);
        requestReset(EMAIL);
        String code = mailer.lastResetCode(EMAIL);

        confirm(EMAIL, code).andExpect(status().isNoContent());
        confirm(EMAIL, code).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_RESET_CODE"));
    }

    @Test
    void 만료된_코드는_거부한다() throws Exception {
        signupAndVerify(EMAIL);
        requestReset(EMAIL);
        jdbc.update("UPDATE password_reset_tokens SET expires_at = now() - interval '1 second'");

        confirm(EMAIL, mailer.lastResetCode(EMAIL)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_RESET_CODE"));
    }

    @Test
    void 다섯_번_틀리면_맞는_코드도_거부한다() throws Exception {
        signupAndVerify(EMAIL);
        requestReset(EMAIL);
        String code = mailer.lastResetCode(EMAIL);

        for (int i = 0; i < 5; i++) {
            confirm(EMAIL, wrongCode(code)).andExpect(status().isBadRequest());
        }
        confirm(EMAIL, code).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_RESET_CODE"));
        assertThat(login(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void 없는_이메일과_틀린_코드는_같은_오류다() throws Exception {
        confirm("nobody@example.com", "123456").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_RESET_CODE"));
    }

    @Test
    void 재설정_요청은_1분_간격으로만_메일을_보낸다() throws Exception {
        signupAndVerify(EMAIL);
        requestReset(EMAIL);
        requestReset(EMAIL);
        assertThat(mailer.of("password-reset", EMAIL)).hasSize(1);
    }

    @Test
    void 미인증_계정을_재설정하면_이메일_소유가_확인되어_활성화된다() throws Exception {
        signup(EMAIL);
        requestReset(EMAIL);

        confirm(EMAIL, mailer.lastResetCode(EMAIL)).andExpect(status().isNoContent());

        assertThat(jdbc.queryForObject("SELECT status FROM users", String.class)).isEqualTo("ACTIVE");
    }
}
