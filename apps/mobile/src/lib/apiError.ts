/** RFC 9457 ProblemDetail 오류(docs/API.md §1). 웹(apps/web/src/lib/api.ts)과 같은 형태. */

export type FieldError = { field: string; code: string; message: string };

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly errors: FieldError[];
  readonly retryAfterSeconds: number | null;

  constructor(init: {
    status: number;
    code: string;
    title: string;
    errors?: FieldError[];
    retryAfterSeconds?: number | null;
  }) {
    super(init.code);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.title = init.title;
    this.errors = init.errors ?? [];
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
  }

  fieldMessage(field: string): string | undefined {
    return this.errors.find((e) => e.field === field)?.message;
  }
}

const FALLBACK_TITLE = '일시적인 오류가 발생했습니다';

export async function parseProblem(response: Response): Promise<ApiError> {
  const retryAfter = response.headers.get('Retry-After');
  const retryAfterSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : null;
  try {
    const body = await response.json();
    return new ApiError({
      status: response.status,
      code: typeof body.code === 'string' ? body.code : 'UNKNOWN',
      title: typeof body.title === 'string' ? body.title : FALLBACK_TITLE,
      errors: Array.isArray(body.errors) ? body.errors : [],
      retryAfterSeconds,
    });
  } catch {
    return new ApiError({ status: response.status, code: 'UNKNOWN', title: FALLBACK_TITLE, retryAfterSeconds });
  }
}
