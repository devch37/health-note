import { PasswordResetRequestForm } from '@/components/auth/PasswordResetRequestForm';
import { Screen } from '@/components/Screen';

export default function PasswordResetRequestScreen() {
  return (
    <Screen title="비밀번호 재설정" description="가입한 이메일로 재설정 코드를 보내드려요" edges={['bottom']}>
      <PasswordResetRequestForm />
    </Screen>
  );
}
