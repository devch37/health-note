package kr.gumjin.note.user.domain;

import java.util.EnumSet;
import java.util.Set;

public enum ConsentType {
    TERMS,
    PRIVACY,
    /** 건강정보(민감정보) 처리 별도 동의. 문안·요건은 법률 검토 대상(docs/SECURITY.md §8). */
    SENSITIVE_HEALTH_DATA,
    MARKETING;

    public static final Set<ConsentType> REQUIRED = EnumSet.of(TERMS, PRIVACY, SENSITIVE_HEALTH_DATA);
}
