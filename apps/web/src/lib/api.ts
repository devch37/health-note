/**
 * 백엔드 API 클라이언트. 같은 출처(/api, Next rewrites)로 호출하며
 * 상태 변경 요청에는 XSRF-TOKEN 쿠키 값을 X-XSRF-TOKEN 헤더로 보낸다(docs/API.md §1).
 */

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
    this.name = "ApiError";
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

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function readCookie(name: string, cookieString: string = document.cookie): string | null {
  for (const part of cookieString.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

async function ensureCsrfToken(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) {
    return existing;
  }
  await fetch("/api/v1/auth/csrf", { credentials: "same-origin" });
  const issued = readCookie(CSRF_COOKIE);
  if (!issued) {
    throw new ApiError({ status: 0, code: "CSRF_UNAVAILABLE", title: "요청을 준비하지 못했습니다. 새로고침해주세요" });
  }
  return issued;
}

export async function parseProblem(response: Response): Promise<ApiError> {
  const retryAfter = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : null;
  try {
    const body = await response.json();
    return new ApiError({
      status: response.status,
      code: typeof body.code === "string" ? body.code : "UNKNOWN",
      title: typeof body.title === "string" ? body.title : "일시적인 오류가 발생했습니다",
      errors: Array.isArray(body.errors) ? body.errors : [],
      retryAfterSeconds,
    });
  } catch {
    return new ApiError({
      status: response.status,
      code: "UNKNOWN",
      title: "일시적인 오류가 발생했습니다",
      retryAfterSeconds,
    });
  }
}

type RequestOptions = { method?: string; body?: unknown };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (UNSAFE_METHODS.has(method)) {
    headers[CSRF_HEADER] = await ensureCsrfToken();
  }

  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", title: "네트워크 연결을 확인해주세요" });
  }

  if (!response.ok) {
    throw await parseProblem(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
