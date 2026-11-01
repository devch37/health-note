package kr.gumjin.note.support;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** 이메일 인증이 필요한 API 경로를 흉내 내는 테스트 전용 컨트롤러(건강정보 API 대역). */
@RestController
public class ProtectedTestController {

    @GetMapping("/api/v1/test-only/protected")
    public Map<String, String> protectedResource() {
        return Map.of("ok", "true");
    }
}
