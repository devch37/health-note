package kr.gumjin.note.global;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import kr.gumjin.note.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class ErrorFormatTest extends IntegrationTest {

    @Test
    void 잘못된_JSON은_400_MALFORMED_REQUEST이다() throws Exception {
        mvc.perform(postJson("/api/v1/auth/login", "{not-json"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.type").value("https://gumjin.note/problems/malformed-request"))
                .andExpect(jsonPath("$.title").isNotEmpty());
    }

    @Test
    void 검증_실패는_필드별_오류를_포함한다() throws Exception {
        mvc.perform(postJson("/api/v1/auth/login", "{\"email\":\"not-an-email\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors.length()").value(2));
    }
}
