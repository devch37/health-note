import { SignupForm } from '@/components/auth/SignupForm';
import { Screen } from '@/components/Screen';

export default function SignupScreen() {
  return (
    <Screen title="가입하기" description="건강검진 기록을 시작해요" edges={['bottom']}>
      <SignupForm />
    </Screen>
  );
}
