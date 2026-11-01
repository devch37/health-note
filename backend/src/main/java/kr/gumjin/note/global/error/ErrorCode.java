package kr.gumjin.note.global.error;

import org.springframework.http.HttpStatus;

/**
 * API 오류 코드. 메시지에는 건강정보·이메일 등 사용자 데이터를 넣지 않는다.
 */
public enum ErrorCode {
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "입력값을 확인해주세요"),
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST, "요청 형식이 올바르지 않습니다"),
    REQUIRED_CONSENT_MISSING(HttpStatus.BAD_REQUEST, "필수 동의 항목에 동의해주세요"),
    INVALID_VERIFICATION_CODE(HttpStatus.BAD_REQUEST, "인증코드가 올바르지 않거나 만료되었습니다"),
    INVALID_RESET_CODE(HttpStatus.BAD_REQUEST, "재설정 코드가 올바르지 않거나 만료되었습니다"),
    WITHDRAWAL_CONFIRMATION_MISMATCH(HttpStatus.BAD_REQUEST, "확인 문구를 정확히 입력해주세요"),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다"),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다"),
    EMAIL_NOT_VERIFIED(HttpStatus.FORBIDDEN, "이메일 인증이 필요합니다"),
    CSRF_INVALID(HttpStatus.FORBIDDEN, "요청을 확인할 수 없습니다. 페이지를 새로고침해주세요"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근 권한이 없습니다"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 정보를 찾을 수 없습니다"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청입니다"),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "요청이 너무 많습니다. 잠시 후 다시 시도해주세요"),
    LOGIN_TEMPORARILY_LOCKED(HttpStatus.TOO_MANY_REQUESTS, "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요"),
    MAIL_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "일시적인 오류가 발생했습니다");

    private final HttpStatus status;
    private final String title;

    ErrorCode(HttpStatus status, String title) {
        this.status = status;
        this.title = title;
    }

    public HttpStatus status() {
        return status;
    }

    public String title() {
        return title;
    }
}
