package kr.gumjin.note.user.domain;

import java.util.Map;

/**
 * 현재 유효한 동의서 버전. 문안이 바뀌면 버전을 올리고 재동의 흐름을 설계한다.
 */
public final class ConsentPolicy {

    public static final Map<ConsentType, String> CURRENT_VERSIONS = Map.of(
            ConsentType.TERMS, "2026-10-01",
            ConsentType.PRIVACY, "2026-10-01",
            ConsentType.SENSITIVE_HEALTH_DATA, "2026-10-01",
            ConsentType.MARKETING, "2026-10-01");

    private ConsentPolicy() {
    }
}
