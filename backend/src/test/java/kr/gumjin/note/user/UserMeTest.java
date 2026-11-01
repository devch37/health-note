package kr.gumjin.note.user;

import static org.assertj.core.api.Assertions.assertThat;
import static kr.gumjin.note.support.IntegrationTest.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import kr.gumjin.note.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class UserMeTest extends IntegrationTest {

    private static final String EMAIL = "me@example.com";
    private static final String NEW_PASSWORD = "brand-new-password-1";

    @Test
    void 로그인하지_않으면_401_ProblemDetail을_반환한다() throws Exception {
        mvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.instance").value("/api/v1/users/me"))
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    @Test
    void 비밀번호를_바꾸면_다른_세션은_끊기고_현재_세션은_유지된다() throws Exception {
        Cookie current = signupAndVerify(EMAIL);
        Cookie other = loginOk(EMAIL, PASSWORD);

        mvc.perform(put("/api/v1/users/me/password").with(csrf()).cookie(current)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword":"%s","newPassword":"%s"}""".formatted(PASSWORD, NEW_PASSWORD)))
                .andExpect(status().isNoContent());

        assertThat(meStatus(current)).isEqualTo(200);
        assertThat(meStatus(other)).isEqualTo(401);
        assertThat(login(EMAIL, NEW_PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void 현재_비밀번호가_틀리면_변경하지_않는다() throws Exception {
        Cookie session = signupAndVerify(EMAIL);

        mvc.perform(put("/api/v1/users/me/password").with(csrf()).cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword":"wrong-password-1","newPassword":"%s"}""".formatted(NEW_PASSWORD)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_PASSWORD"));
        assertThat(login(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void 확인_문구가_다르면_탈퇴하지_않는다() throws Exception {
        Cookie session = signupAndVerify(EMAIL);

        mvc.perform(delete("/api/v1/users/me").with(csrf()).cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"password":"%s","confirmText":"삭제"}""".formatted(PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("WITHDRAWAL_CONFIRMATION_MISMATCH"));
        assertThat(meStatus(session)).isEqualTo(200);
    }

    @Test
    void 탈퇴하면_모든_세션이_끊기고_로그인할_수_없으며_같은_이메일로_재가입할_수_있다() throws Exception {
        Cookie session = signupAndVerify(EMAIL);
        Cookie other = loginOk(EMAIL, PASSWORD);

        mvc.perform(delete("/api/v1/users/me").with(csrf()).cookie(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"password":"%s","confirmText":"탈퇴"}""".formatted(PASSWORD)))
                .andExpect(status().isNoContent());

        assertThat(meStatus(session)).isEqualTo(401);
        assertThat(meStatus(other)).isEqualTo(401);
        assertThat(login(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(401);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM users WHERE email = ?", Integer.class, EMAIL)).isZero();

        signup(EMAIL);
        assertThat(jdbc.queryForObject(
                "SELECT status FROM users WHERE email = ? AND deleted_at IS NULL", String.class, EMAIL))
                .isEqualTo("PENDING_VERIFICATION");
    }
}
