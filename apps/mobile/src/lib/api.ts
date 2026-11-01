import { ApiError, parseProblem } from './apiError';
import { resolveApiOrigin } from './config';
import { tokenStore } from './tokenStore';

/**
 * 백엔드 API 클라이언트(docs/API.md §1 인증 — 앱 방식).
 * 모든 요청에 X-Client: app을 보내고, 저장된 세션 토큰은 X-Auth-Token 헤더로 보낸다.
 * 응답에 새 X-Auth-Token이 오면(로그인·인증 완료) 저장한다. 쿠키·CSRF는 쓰지 않는다.
 */

const AUTH_TOKEN_HEADER = 'X-Auth-Token';

let onUnauthorized: (() => void) | null = null;

/** 저장된 토큰이 거절됐을 때(만료·로그아웃·비밀번호 변경) 호출할 함수. 세션 상태를 비우는 데 쓴다. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type RequestOptions = { method?: string; body?: unknown };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Client': 'app' };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = await tokenStore.get();
  if (token) {
    headers[AUTH_TOKEN_HEADER] = token;
  }

  let response: Response;
  try {
    response = await fetch(`${resolveApiOrigin()}/api/v1${path}`, {
      method,
      headers,
      credentials: 'omit',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', title: '네트워크 연결을 확인해주세요' });
  }

  const issued = response.headers.get(AUTH_TOKEN_HEADER);
  if (issued) {
    await tokenStore.set(issued);
  } else if (issued === '') {
    // 서버가 세션을 끝냈다(로그아웃).
    await tokenStore.clear();
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      await tokenStore.clear();
      onUnauthorized?.();
    }
    throw await parseProblem(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
