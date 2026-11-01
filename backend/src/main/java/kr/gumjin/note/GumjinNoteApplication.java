package kr.gumjin.note;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

// 인증은 자체 구현(auth 모듈)이므로 기본 인메모리 사용자와 생성 비밀번호 로그를 끈다.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
public class GumjinNoteApplication {

    public static void main(String[] args) {
        SpringApplication.run(GumjinNoteApplication.class, args);
    }
}
