package kr.gumjin.note.global;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import jakarta.servlet.http.Cookie;
import kr.gumjin.note.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;

/** 인증 흐름 전체에서 이메일·비밀번호·인증코드·세션 ID·앱 세션 토큰이 로그에 남지 않는지 확인한다. */
@ExtendWith(OutputCaptureExtension.class)
class SensitiveLoggingTest extends IntegrationTest {

    @Test
    void 인증_흐름에서_민감정보를_로그에_남기지_않는다(CapturedOutput output) throws Exception {
        String email = "secret-person@example.com";
        Cookie session = signupAndVerify(email);
        String code = mailer.lastCode(email);
        login(email, "wrong-password-xyz");
        loginOk(email, PASSWORD);
        mvc.perform(postJson("/api/v1/auth/password-reset/request", "{\"email\":\"%s\"}".formatted(email)));
        String resetCode = mailer.lastResetCode(email);
        String appToken = mvc.perform(post("/api/v1/auth/login").header("X-Client", "app")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, PASSWORD)))
                .andReturn().getResponse().getHeader("X-Auth-Token");
        assertThat(appToken).isNotBlank();

        assertThat(output.getAll())
                .doesNotContain(email)
                .doesNotContain("secret-person")
                .doesNotContain(PASSWORD)
                .doesNotContain("wrong-password-xyz")
                .doesNotContainPattern("(?i)code[^\\n]{0,20}" + resetCode)
                .doesNotContain(session.getValue())
                .doesNotContain(appToken)
                .doesNotContain("generated security password")
                .doesNotContainPattern("(?i)code[^\\n]{0,20}" + code);
    }
}
