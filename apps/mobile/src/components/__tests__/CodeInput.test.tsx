import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { CodeInput } from '@/components/ui/CodeInput';

function Harness() {
  const [code, setCode] = useState('');
  return <CodeInput label="인증코드 6자리" value={code} onChangeText={setCode} />;
}

test('숫자만 남기고 6자리까지만 받는다', async () => {
  const user = userEvent.setup();
  await render(<Harness />);
  const input = screen.getByLabelText('인증코드 6자리');

  await user.paste(input, '12-34 5678');

  expect(input).toHaveDisplayValue('123456');
});
