package kr.gumjin.note.global.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @NotBlank String mailFrom,
        @NotBlank @Size(min = 32) String tokenSecret,
        /** 브라우저에서 앱을 미리 볼 때(Expo 웹, local 프로필)만 쓴다. 운영 앱은 브라우저가 아니므로 비워 둔다. */
        @DefaultValue List<String> corsAllowedOrigins
) {
}
