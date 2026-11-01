import { Screen } from '@/components/Screen';
import { WithdrawForm } from '@/components/me/WithdrawForm';

export default function WithdrawScreen() {
  return (
    <Screen edges={['bottom']}>
      <WithdrawForm />
    </Screen>
  );
}
