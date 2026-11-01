package kr.gumjin.note.global.error;

import java.time.Duration;

public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Duration retryAfter;

    public ApiException(ErrorCode errorCode) {
        this(errorCode, null);
    }

    public ApiException(ErrorCode errorCode, Duration retryAfter) {
        super(errorCode.name());
        this.errorCode = errorCode;
        this.retryAfter = retryAfter;
    }

    public ErrorCode errorCode() {
        return errorCode;
    }

    public Duration retryAfter() {
        return retryAfter;
    }
}
