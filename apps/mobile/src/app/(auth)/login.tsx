import { LoginForm } from '@/components/auth/LoginForm';
import { Screen } from '@/components/Screen';

export default function LoginScreen() {
  return (
    <Screen title="로그인" edges={['bottom']}>
      <LoginForm />
    </Screen>
  );
}
