import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';
import { Screen } from '@/components/Screen';

export default function VerifyEmailScreen() {
  return (
    <Screen title="이메일 인증" description="메일로 받은 6자리 코드를 입력해주세요" edges={['bottom']}>
      <VerifyEmailForm />
    </Screen>
  );
}
