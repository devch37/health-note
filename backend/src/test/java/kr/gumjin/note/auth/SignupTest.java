package kr.gumjin.note.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import kr.gumjin.note.support.IntegrationTest;
import org.junit.jupiter.api.Test;

class SignupTest extends IntegrationTest {

    @Test
    void 가입하면_미인증_계정과_동의이력이_저장되고_인증코드가_발송된다() throws Exception {
        signup("New@Example.com");

        Map<String, Object> user = jdbc.queryForMap("SELECT email::text AS email, status, password_hash FROM users");
        assertThat(user.get("email")).isEqualTo("new@example.com");
        assertThat(user.get("status")).isEqualTo("PENDING_VERIFICATION");
        assertThat((String) user.get("password_hash")).startsWith("{argon2}").doesNotContain(PASSWORD);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM user_consents", Integer.class)).isEqualTo(3);

        String code = mailer.lastCode("new@example.com");
        assertThat(code).matches("\\d{6}");
        String storedHash = jdbc.queryForObject("SELECT code_hash FROM email_verifications", String.class);
        assertThat(storedHash).isNotEqualTo(code).doesNotContain(code);
    }

    @Test
    void 필수_동의가_없으면_거부한다() throws Exception {
        mvc.perform(postJson("/api/v1/auth/signup", """
                        {"email":"a@example.com","password":"%s",
                         "consents":[{"type":"TERMS","version":"2026-10-01"},{"type":"PRIVACY","version":"2026-10-01"}]}"""
                        .formatted(PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("REQUIRED_CONSENT_MISSING"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM users", Integer.class)).isZero();
    }

    @Test
    void 구버전_동의는_거부한다() throws Exception {
        mvc.perform(postJson("/api/v1/auth/signup", """
                        {"email":"a@example.com","password":"%s",
                         "consents":[{"type":"TERMS","version":"2020-01-01"},{"type":"PRIVACY","version":"2026-10-01"},
                                     {"type":"SENSITIVE_HEALTH_DATA","version":"2026-10-01"}]}""".formatted(PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("REQUIRED_CONSENT_MISSING"));
    }

    @Test
    void 짧은_비밀번호는_필드_오류로_거부한다() throws Exception {
        mvc.perform(postJson("/api/v1/auth/signup", """
                        {"email":"a@example.com","password":"short","consents":%s}""".formatted(CONSENTS)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("password"))
                .andExpect(jsonPath("$.errors[0].rejectedValue").doesNotExist());
    }

    @Test
    void 이메일과_같은_비밀번호는_거부한다() throws Exception {
        mvc.perform(postJson("/api/v1/auth/signup", """
                        {"email":"longname@example.com","password":"LongName@example.com","consents":%s}"""
                        .formatted(CONSENTS)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("PASSWORD_SAME_AS_EMAIL"));
    }

    @Test
    void 이미_인증된_이메일로_가입해도_같은_응답을_주고_안내메일만_보낸다() throws Exception {
        signupAndVerify("dup@example.com");

        mvc.perform(postJson("/api/v1/auth/signup", """
                        {"email":"dup@example.com","password":"another-password-1","consents":%s}""".formatted(CONSENTS)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("VERIFICATION_REQUIRED"));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM users", Integer.class)).isEqualTo(1);
        assertThat(mailer.of("already-registered", "dup@example.com")).hasSize(1);
    }

    @Test
    void 미인증_계정에_다시_가입해도_비밀번호를_바꾸지_않는다() throws Exception {
        signup("pending@example.com");
        String before = jdbc.queryForObject("SELECT password_hash FROM users", String.class);

        mvc.perform(postJson("/api/v1/auth/signup", """
                        {"email":"pending@example.com","password":"attacker-password","consents":%s}""".formatted(CONSENTS)))
                .andExpect(status().isAccepted());

        assertThat(jdbc.queryForObject("SELECT password_hash FROM users", String.class)).isEqualTo(before);
    }
}
