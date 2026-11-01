import { jsonResponse } from '@/testing/render';
import { apiRequest, setUnauthorizedHandler } from '../api';
import { ApiError } from '../apiError';
import { tokenStore } from '../tokenStore';

jest.mock('../tokenStore', () => {
  let token: string | null = null;
  return {
    tokenStore: {
      get: jest.fn(async () => token),
      set: jest.fn(async (value: string) => {
        token = value;
      }),
      clear: jest.fn(async () => {
        token = null;
      }),
    },
  };
});

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

function sentHeaders(): Record<string, string> {
  return fetchMock.mock.calls.at(-1)[1].headers;
}

beforeEach(async () => {
  fetchMock.mockReset();
  await tokenStore.clear();
  setUnauthorizedHandler(null);
});

test('앱임을 알리고 쿠키를 싣지 않는다', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

  await apiRequest('/users/me');

  expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/users\/me$/);
  expect(sentHeaders()['X-Client']).toBe('app');
  expect(sentHeaders()['X-Auth-Token']).toBeUndefined();
  expect(fetchMock.mock.calls[0][1].credentials).toBe('omit');
});

test('응답으로 받은 세션 토큰을 저장하고 다음 요청에 헤더로 보낸다', async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(200, { user: {} }, { 'X-Auth-Token': 'token-1' }));
  fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));

  await apiRequest('/auth/login', { method: 'POST', body: { email: 'a@example.com', password: 'x' } });
  await apiRequest('/users/me');

  expect(tokenStore.set).toHaveBeenCalledWith('token-1');
  expect(sentHeaders()['X-Auth-Token']).toBe('token-1');
});

test('저장된 토큰이 401이면 토큰을 지우고 세션 해제를 알린다', async () => {
  await tokenStore.set('expired');
  const handler = jest.fn();
  setUnauthorizedHandler(handler);
  fetchMock.mockResolvedValue(jsonResponse(401, { code: 'UNAUTHENTICATED', title: '로그인이 필요합니다' }));

  await expect(apiRequest('/users/me')).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });

  expect(await tokenStore.get()).toBeNull();
  expect(handler).toHaveBeenCalledTimes(1);
});

test('토큰 없이 받은 401(로그인 실패)은 세션 해제를 알리지 않는다', async () => {
  const handler = jest.fn();
  setUnauthorizedHandler(handler);
  fetchMock.mockResolvedValue(jsonResponse(401, { code: 'INVALID_CREDENTIALS', title: '이메일 또는 비밀번호가 올바르지 않습니다' }));

  await expect(apiRequest('/auth/login', { method: 'POST', body: {} })).rejects.toBeInstanceOf(ApiError);
  expect(handler).not.toHaveBeenCalled();
});

test('ProblemDetail의 필드 오류와 Retry-After를 읽는다', async () => {
  fetchMock.mockResolvedValue(
    jsonResponse(
      429,
      { code: 'LOGIN_TEMPORARILY_LOCKED', title: '잠시 후 다시 시도해주세요', errors: [{ field: 'email', code: 'x', message: '확인' }] },
      { 'Retry-After': '120' },
    ),
  );

  const error = await apiRequest('/auth/login', { method: 'POST', body: {} }).catch((e: ApiError) => e);

  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).retryAfterSeconds).toBe(120);
  expect((error as ApiError).fieldMessage('email')).toBe('확인');
});

test('네트워크 오류는 NETWORK_ERROR로 바꾼다', async () => {
  fetchMock.mockRejectedValue(new TypeError('Network request failed'));

  await expect(apiRequest('/users/me')).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
});

test('204 응답은 본문 없이 끝난다', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

  await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
});
