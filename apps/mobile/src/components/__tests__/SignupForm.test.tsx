import { screen, userEvent } from '@testing-library/react-native';
import { SignupForm } from '@/components/auth/SignupForm';
import { pendingEmail } from '@/lib/pendingEmail';
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

beforeEach(() => {
  fetchMock.mockReset();
  mockRouter.push.mockReset();
  pendingEmail.clear();
});

test('필수 동의가 없으면 요청하지 않고 안내한다', async () => {
  const user = userEvent.setup();
  await renderWithClient(<SignupForm />);

  await user.type(screen.getByLabelText('이메일'), 'new@example.com');
  await user.type(screen.getByLabelText('비밀번호'), 'long-enough-pw');
  await user.type(screen.getByLabelText('비밀번호 확인'), 'long-enough-pw');
  await user.press(screen.getByRole('button', { name: '가입하기' }));

  expect(await screen.findByText('필수 항목에 동의해주세요')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('비밀번호가 짧거나 다르면 안내한다', async () => {
  const user = userEvent.setup();
  await renderWithClient(<SignupForm />);

  await user.type(screen.getByLabelText('이메일'), 'new@example.com');
  await user.type(screen.getByLabelText('비밀번호'), 'short');
  await user.type(screen.getByLabelText('비밀번호 확인'), 'different');
  await user.press(screen.getByRole('button', { name: '가입하기' }));

  expect(await screen.findByText('비밀번호는 10자 이상으로 입력해주세요')).toBeOnTheScreen();
  expect(screen.getByText('비밀번호가 일치하지 않아요')).toBeOnTheScreen();
});

test('전체 동의 후 가입하면 동의 이력을 보내고 이메일을 URL 없이 인증 화면으로 넘긴다', async () => {
  fetchMock.mockResolvedValue(jsonResponse(202, { status: 'VERIFICATION_REQUIRED' }));
  const user = userEvent.setup();
  await renderWithClient(<SignupForm />);

  await user.type(screen.getByLabelText('이메일'), ' new@example.com ');
  await user.type(screen.getByLabelText('비밀번호'), 'long-enough-pw');
  await user.type(screen.getByLabelText('비밀번호 확인'), 'long-enough-pw');
  await user.press(screen.getByRole('checkbox', { name: '전체 동의' }));
  await user.press(screen.getByRole('button', { name: '가입하기' }));

  await screen.findByRole('button', { name: '가입하기' });
  expect(mockRouter.push).toHaveBeenCalledWith('/verify');
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.email).toBe('new@example.com');
  expect(body.consents.map((c: { type: string }) => c.type).sort()).toEqual(
    ['MARKETING', 'PRIVACY', 'SENSITIVE_HEALTH_DATA', 'TERMS'],
  );
  expect(pendingEmail.get()).toBe('new@example.com');
});
