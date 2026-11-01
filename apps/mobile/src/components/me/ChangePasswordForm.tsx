import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { PASSWORD_MIN_LENGTH, useChangePassword } from '@/lib/auth';
import { space } from '@/theme';

export function ChangePasswordForm() {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit() {
    if (!current) return setError('현재 비밀번호를 입력해주세요');
    if (next.length < PASSWORD_MIN_LENGTH) return setError('새 비밀번호는 10자 이상으로 입력해주세요');
    setError(null);
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
        },
      },
    );
  }

  return (
    <View style={styles.form}>
      <TextField label="현재 비밀번호" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" textContentType="password" />
      <TextField label="새 비밀번호" value={next} onChangeText={setNext} secureTextEntry autoComplete="new-password" textContentType="newPassword" hint="10자 이상" />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {change.error ? <Alert tone="error">{change.error.fieldMessage('newPassword') ?? change.error.title}</Alert> : null}
      {change.isSuccess ? <Alert tone="success">비밀번호를 바꿨어요. 다른 기기의 로그인은 해제됐어요.</Alert> : null}
      <Button title="비밀번호 변경" variant="secondary" onPress={onSubmit} loading={change.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({ form: { gap: space.md } });
