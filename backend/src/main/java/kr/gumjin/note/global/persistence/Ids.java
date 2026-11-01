package kr.gumjin.note.global.persistence;

import java.security.SecureRandom;
import java.util.UUID;

/**
 * UUIDv7(RFC 9562) 생성. 시간순 정렬이 되어 인덱스 지역성이 좋고, 나머지 비트는 난수라 추측하기 어렵다.
 * 추측 불가성은 보조 수단일 뿐이며 소유권 검증을 대체하지 않는다.
 */
public final class Ids {

    private static final SecureRandom RANDOM = new SecureRandom();

    private Ids() {
    }

    public static UUID newId() {
        long millis = System.currentTimeMillis();
        long randA = RANDOM.nextInt(1 << 12);
        long msb = (millis << 16) | (0x7L << 12) | randA;
        long lsb = (RANDOM.nextLong() & 0x3FFFFFFFFFFFFFFFL) | 0x8000000000000000L;
        return new UUID(msb, lsb);
    }
}
