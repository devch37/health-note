package kr.gumjin.note.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public abstract class IntegrationTest {

    public static final String SESSION_COOKIE = "GN_SESSION";
    public static final String PASSWORD = "correct-horse-battery";
    public static final String CONSENTS = """
            [{"type":"TERMS","version":"2026-10-01"},
             {"type":"PRIVACY","version":"2026-10-01"},
             {"type":"SENSITIVE_HEALTH_DATA","version":"2026-10-01"}]""";

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected RecordingAuthMailer mailer;

    @Autowired
    protected MutableClock clock;

    @BeforeEach
    void resetState() {
        jdbc.execute("TRUNCATE login_attempts, email_verifications, password_reset_tokens, user_consents, users, "
                + "spring_session_attributes, spring_session CASCADE");
        mailer.clear();
        clock.reset();
    }

    /**
     * 실제 브라우저처럼 XSRF-TOKEN 쿠키와 같은 값을 헤더로 보낸다.
     * spring-security-test의 csrf()는 공유 필터의 저장소를 바꿔 다른 테스트에 영향을 주므로 쓰지 않는다.
     */
    public static RequestPostProcessor csrf() {
        return request -> {
            String token = "test-csrf-token";
            Cookie[] existing = request.getCookies() == null ? new Cookie[0] : request.getCookies();
            Cookie[] cookies = java.util.Arrays.copyOf(existing, existing.length + 1);
            cookies[existing.length] = new Cookie("XSRF-TOKEN", token);
            request.setCookies(cookies);
            request.addHeader("X-XSRF-TOKEN", token);
            return request;
        };
    }

    protected MockHttpServletRequestBuilder postJson(String url, String body) {
        return post(url).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body);
    }

    protected MvcResult signup(String email) throws Exception {
        return mvc.perform(postJson("/api/v1/auth/signup", """
                        {"email":"%s","password":"%s","consents":%s}""".formatted(email, PASSWORD, CONSENTS)))
                .andExpect(status().isAccepted())
                .andReturn();
    }

    /** 가입 + 이메일 인증을 마치고 로그인된 세션 쿠키를 돌려준다. */
    protected Cookie signupAndVerify(String email) throws Exception {
        signup(email);
        MvcResult result = mvc.perform(postJson("/api/v1/auth/email-verifications/confirm", """
                        {"email":"%s","code":"%s"}""".formatted(email, mailer.lastCode(email))))
                .andExpect(status().isOk())
                .andReturn();
        return sessionCookie(result);
    }

    protected MvcResult login(String email, String password) throws Exception {
        return mvc.perform(postJson("/api/v1/auth/login", """
                {"email":"%s","password":"%s"}""".formatted(email, password))).andReturn();
    }

    protected Cookie loginOk(String email, String password) throws Exception {
        MvcResult result = login(email, password);
        if (result.getResponse().getStatus() != 200) {
            throw new AssertionError("login failed: " + result.getResponse().getStatus());
        }
        return sessionCookie(result);
    }

    protected int meStatus(Cookie session) throws Exception {
        MockHttpServletRequestBuilder request = get("/api/v1/users/me");
        if (session != null) {
            request.cookie(session);
        }
        return mvc.perform(request).andReturn().getResponse().getStatus();
    }

    protected static Cookie sessionCookie(MvcResult result) {
        Cookie cookie = result.getResponse().getCookie(SESSION_COOKIE);
        if (cookie == null) {
            throw new AssertionError("no session cookie");
        }
        return cookie;
    }
}
