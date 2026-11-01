package kr.gumjin.note.global.error;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ProblemDetail> handleApi(ApiException e, HttpServletRequest request) {
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(e.errorCode().status());
        if (e.retryAfter() != null) {
            builder.header(HttpHeaders.RETRY_AFTER, String.valueOf(Math.max(1, e.retryAfter().toSeconds())));
        }
        return builder.body(ProblemDetails.of(e.errorCode(), request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException e, HttpServletRequest request) {
        // 거부된 입력값(rejectedValue)은 응답·로그에 넣지 않는다.
        List<ProblemDetails.FieldError> errors = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ProblemDetails.FieldError(fe.getField(), fe.getCode(), fe.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest()
                .body(ProblemDetails.of(ErrorCode.VALIDATION_FAILED, request.getRequestURI(), errors));
    }

    @ExceptionHandler(FieldValidationException.class)
    public ResponseEntity<ProblemDetail> handleFieldValidation(FieldValidationException e, HttpServletRequest request) {
        return ResponseEntity.badRequest()
                .body(ProblemDetails.of(ErrorCode.VALIDATION_FAILED, request.getRequestURI(), List.of(e.toFieldError())));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleUnreadable(HttpServletRequest request) {
        return ResponseEntity.badRequest().body(ProblemDetails.of(ErrorCode.MALFORMED_REQUEST, request.getRequestURI()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(HttpServletRequest request) {
        return ResponseEntity.status(ErrorCode.RESOURCE_NOT_FOUND.status())
                .body(ProblemDetails.of(ErrorCode.RESOURCE_NOT_FOUND, request.getRequestURI()));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ProblemDetail> handleMethod(HttpServletRequest request) {
        return ResponseEntity.status(ErrorCode.METHOD_NOT_ALLOWED.status())
                .body(ProblemDetails.of(ErrorCode.METHOD_NOT_ALLOWED, request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception e, HttpServletRequest request) {
        // 예외 메시지에 사용자 데이터가 섞일 수 있으므로 클래스명과 스택만 남긴다.
        log.error("Unhandled exception: {}", e.getClass().getName(), new SanitizedException(e));
        return ResponseEntity.internalServerError()
                .body(ProblemDetails.of(ErrorCode.INTERNAL_ERROR, request.getRequestURI()));
    }

    /** 원인 예외의 메시지를 제외하고 스택 트레이스만 보존한다. */
    static final class SanitizedException extends RuntimeException {
        SanitizedException(Throwable cause) {
            super(cause.getClass().getName(), null, false, true);
            setStackTrace(cause.getStackTrace());
            if (cause.getCause() != null) {
                initCause(new SanitizedException(cause.getCause()));
            }
        }
    }
}
