package kr.gumjin.note.user.service;

import kr.gumjin.note.global.error.FieldValidationException;

/**
 * 비밀번호 규칙: 10~128자, 이메일과 같을 수 없음. 길이는 DTO에서도 검증한다.
 * 유출 비밀번호 목록 검사는 P1(docs/API.md §2).
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 10;
    public static final int MAX_LENGTH = 128;

    private PasswordPolicy() {
    }

    public static void check(String field, String password, String email) {
        if (password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            throw new FieldValidationException(field, "PASSWORD_LENGTH", "비밀번호는 10자 이상 128자 이하로 입력해주세요");
        }
        if (email != null && password.trim().equalsIgnoreCase(email.trim())) {
            throw new FieldValidationException(field, "PASSWORD_SAME_AS_EMAIL", "이메일과 다른 비밀번호를 입력해주세요");
        }
    }
}
