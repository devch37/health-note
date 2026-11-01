import { PasswordResetConfirmForm } from '@/components/auth/PasswordResetConfirmForm';
import { Screen } from '@/components/Screen';

export default function PasswordResetConfirmScreen() {
  return (
    <Screen title="새 비밀번호 설정" edges={['bottom']}>
      <PasswordResetConfirmForm />
    </Screen>
  );
}
