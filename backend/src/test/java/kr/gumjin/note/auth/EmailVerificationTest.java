package kr.gumjin.note.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import kr.gumjin.note.support.IntegrationTest;
import org.junit.jupiter.api.Test;

class EmailVerificationTest extends IntegrationTest {

    private static final String EMAIL = "verify@example.com";

    private String confirmBody(String email, String code) {
        return """
                {"email":"%s","code":"%s"}""".formatted(email, code);
    }

    private String wrongCode(String code) {
        return code.equals("000000") ? "111111" : "000000";
    }

    @Test
    void 올바른_코드로_인증하면_계정이_활성화되고_로그인된다() throws Exception {
        Cookie session = signupAndVerify(EMAIL);

        mvc.perform(get("/api/v1/users/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.emailVerified").value(true));
        assertThat(jdbc.queryForObject("SELECT consumed_at IS NOT NULL FROM email_verifications", Boolean.class)).isTrue();
    }

    @Test
    void 틀린_코드는_거부하고_5회_실패하면_올바른_코드도_무효가_된다() throws Exception {
        signup(EMAIL);
        String code = mailer.lastCode(EMAIL);

        for (int i = 0; i < 5; i++) {
            mvc.perform(postJson("/api/v1/auth/email-verifications/confirm", confirmBody(EMAIL, wrongCode(code))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("INVALID_VERIFICATION_CODE"));
        }
        mvc.perform(postJson("/api/v1/auth/email-verifications/confirm", confirmBody(EMAIL, code)))
                .andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("SELECT status FROM users", String.class)).isEqualTo("PENDING_VERIFICATION");
    }

    @Test
    void 만료된_코드는_거부한다() throws Exception {
        signup(EMAIL);
        jdbc.update("UPDATE email_verifications SET expires_at = now() - interval '1 second'");

        mvc.perform(postJson("/api/v1/auth/email-verifications/confirm", confirmBody(EMAIL, mailer.lastCode(EMAIL))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_VERIFICATION_CODE"));
    }

    @Test
    void 없는_이메일도_같은_오류로_응답한다() throws Exception {
        mvc.perform(postJson("/api/v1/auth/email-verifications/confirm", confirmBody("nobody@example.com", "123456")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_VERIFICATION_CODE"));
    }

    @Test
    void 재발송은_1분_간격으로만_메일을_보내고_새_코드만_유효하다() throws Exception {
        signup(EMAIL);
        String first = mailer.lastCode(EMAIL);

        mvc.perform(postJson("/api/v1/auth/email-verifications/resend", "{\"email\":\"%s\"}".formatted(EMAIL)))
                .andExpect(status().isAccepted());
        assertThat(mailer.of("verification", EMAIL)).hasSize(1);

        jdbc.update("UPDATE email_verifications SET created_at = created_at - interval '2 minutes'");
        mvc.perform(postJson("/api/v1/auth/email-verifications/resend", "{\"email\":\"%s\"}".formatted(EMAIL)))
                .andExpect(status().isAccepted());
        assertThat(mailer.of("verification", EMAIL)).hasSize(2);

        String second = mailer.lastCode(EMAIL);
        if (!second.equals(first)) {
            mvc.perform(postJson("/api/v1/auth/email-verifications/confirm", confirmBody(EMAIL, first)))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(postJson("/api/v1/auth/email-verifications/confirm", confirmBody(EMAIL, second)))
                .andExpect(status().isOk());
    }

    @Test
    void 없는_이메일_재발송도_202를_반환한다() throws Exception {
        mvc.perform(postJson("/api/v1/auth/email-verifications/resend", "{\"email\":\"nobody@example.com\"}"))
                .andExpect(status().isAccepted());
        assertThat(mailer.all()).isEmpty();
    }
}
