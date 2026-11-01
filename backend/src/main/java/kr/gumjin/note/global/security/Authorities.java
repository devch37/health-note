package kr.gumjin.note.global.security;

public final class Authorities {

    public static final String USER = "ROLE_USER";
    /** 건강정보 API 접근에 필요한 권한. 이메일 인증을 마친 ACTIVE 계정만 가진다. */
    public static final String EMAIL_VERIFIED = "EMAIL_VERIFIED";

    private Authorities() {
    }
}
