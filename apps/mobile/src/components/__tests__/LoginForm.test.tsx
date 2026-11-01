import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { LoginForm } from '@/components/auth/LoginForm';
import { jsonResponse, renderWithClient } from '@/testing/render';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/lib/tokenStore', () => ({
  tokenStore: { get: jest.fn(async () => null), set: jest.fn(), clear: jest.fn() },
}));

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const user = { id: 'u1', email: 'a@example.com', status: 'ACTIVE', createdAt: '2026-10-01T00:00:00Z' };

beforeEach(() => {
  fetchMock.mockReset();
  mockRouter.replace.mockReset();
});

async function submit(email: string, password: string) {
  const u = userEvent.setup();
  await renderWithClient(<LoginForm />);
  await u.type(screen.getByLabelText('이메일'), email);
  await u.type(screen.getByLabelText('비밀번호'), password);
  await u.press(screen.getByRole('button', { name: '로그인' }));
}

test('비어 있으면 요청하지 않는다', async () => {
  const u = userEvent.setup();
  await renderWithClient(<LoginForm />);
  await u.press(screen.getByRole('button', { name: '로그인' }));

  expect(await screen.findByText('이메일과 비밀번호를 입력해주세요.')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('미인증 계정은 인증 화면으로 보낸다', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { user: { ...user, emailVerified: false } }, { 'X-Auth-Token': 't' }));
  await submit('a@example.com', 'whatever-pw');

  await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/verify'));
});

test('인증 완료 계정은 화면을 직접 바꾸지 않는다(세션 상태가 홈으로 보낸다)', async () => {
  fetchMock.mockResolvedValue(jsonResponse(200, { user: { ...user, emailVerified: true } }, { 'X-Auth-Token': 't' }));
  await submit('a@example.com', 'whatever-pw');

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

test('잠금 응답은 남은 시간을 함께 보여준다', async () => {
  fetchMock.mockResolvedValue(
    jsonResponse(429, { code: 'LOGIN_TEMPORARILY_LOCKED', title: '로그인 시도가 많아 잠시 제한됐어요' }, { 'Retry-After': '600' }),
  );
  await submit('a@example.com', 'wrong-password');

  expect(await screen.findByText('로그인 시도가 많아 잠시 제한됐어요 (약 10분 후)')).toBeOnTheScreen();
});
