package kr.gumjin.note.global.error;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import org.slf4j.MDC;
import org.springframework.http.ProblemDetail;

/**
 * RFC 9457 ProblemDetail 생성. 모든 오류 응답은 이 형식을 따른다(docs/API.md §1).
 */
public final class ProblemDetails {

    public static final String TRACE_ID_KEY = "traceId";
    private static final String TYPE_BASE = "https://gumjin.note/problems/";

    private ProblemDetails() {
    }

    public static ProblemDetail of(ErrorCode code, String instance) {
        return of(code, instance, List.of());
    }

    public static ProblemDetail of(ErrorCode code, String instance, List<FieldError> errors) {
        ProblemDetail problem = ProblemDetail.forStatus(code.status());
        problem.setType(URI.create(TYPE_BASE + code.name().toLowerCase(Locale.ROOT).replace('_', '-')));
        problem.setTitle(code.title());
        problem.setInstance(URI.create(instance));
        problem.setProperty("code", code.name());
        if (!errors.isEmpty()) {
            problem.setProperty("errors", errors);
        }
        String traceId = MDC.get(TRACE_ID_KEY);
        if (traceId != null) {
            problem.setProperty(TRACE_ID_KEY, traceId);
        }
        return problem;
    }

    public record FieldError(String field, String code, String message) {
    }
}
