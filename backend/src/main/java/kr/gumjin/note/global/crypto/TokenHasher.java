package kr.gumjin.note.global.crypto;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import kr.gumjin.note.global.config.AppProperties;
import org.springframework.stereotype.Component;

/**
 * 인증코드·토큰·식별자를 원문 대신 저장하기 위한 해시와 난수 생성.
 */
@Component
public class TokenHasher {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final SecureRandom random = new SecureRandom();
    private final SecretKeySpec key;

    public TokenHasher(AppProperties properties) {
        this.key = new SecretKeySpec(properties.tokenSecret().getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
    }

    /** 서버 비밀키로 HMAC한 hex 문자열. 같은 입력은 항상 같은 값이므로 조회 키로 쓸 수 있다. */
    public String hmac(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(key);
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC unavailable", e);
        }
    }

    /** 이메일처럼 대소문자 차이가 의미 없는 값의 HMAC. */
    public String hmacNormalized(String value) {
        return hmac(value.trim().toLowerCase(Locale.ROOT));
    }

    public boolean matches(String rawValue, String expectedHash) {
        return MessageDigest.isEqual(
                hmac(rawValue).getBytes(StandardCharsets.US_ASCII),
                expectedHash.getBytes(StandardCharsets.US_ASCII));
    }

    public String randomDigits(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    public String randomUrlToken(int bytes) {
        byte[] buffer = new byte[bytes];
        random.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }
}
