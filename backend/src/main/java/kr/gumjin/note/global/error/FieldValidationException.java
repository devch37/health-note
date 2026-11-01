package kr.gumjin.note.global.error;

/**
 * Bean Validation으로 표현하기 어려운 필드 검증 실패. 400 VALIDATION_FAILED + errors[]로 응답한다.
 */
public class FieldValidationException extends RuntimeException {

    private final String field;
    private final String code;
    private final String userMessage;

    public FieldValidationException(String field, String code, String userMessage) {
        super(code);
        this.field = field;
        this.code = code;
        this.userMessage = userMessage;
    }

    public ProblemDetails.FieldError toFieldError() {
        return new ProblemDetails.FieldError(field, code, userMessage);
    }
}
