import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CodeInput } from '@/components/ui/CodeInput';
import { TextField } from '@/components/ui/TextField';
import { PASSWORD_MIN_LENGTH, useConfirmPasswordReset } from '@/lib/auth';
import { pendingEmail } from '@/lib/pendingEmail';
import { colors, font, space } from '@/theme';

export function PasswordResetConfirmForm() {
  const router = useRouter();
  const confirm = useConfirmPasswordReset();
  const [email, setEmail] = useState(() => pendingEmail.get() ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onSubmit() {
    if (!email.trim() || code.length !== 6) return setError('이메일과 재설정 코드 6자리를 입력해주세요');
    if (password.length < PASSWORD_MIN_LENGTH) return setError('비밀번호는 10자 이상으로 입력해주세요');
    if (password !== passwordConfirm) return setError('비밀번호가 일치하지 않아요');
    setError(null);
    confirm.mutate({ email: email.trim(), code, newPassword: password }, { onSuccess: () => pendingEmail.clear() });
  }

  if (confirm.isSuccess) {
    return (
      <View style={styles.form}>
        <Alert tone="success">비밀번호를 바꿨어요. 다른 기기의 로그인은 모두 해제됐어요.</Alert>
        <Button title="로그인하기" onPress={() => router.replace('/login')} />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.help}>가입된 이메일이라면 재설정 코드를 보냈어요. 코드는 30분 동안 유효해요.</Text>
      <TextField
        label="가입한 이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <CodeInput label="재설정 코드 6자리" value={code} onChangeText={setCode} />
      <TextField
        label="새 비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint="10자 이상"
      />
      <TextField
        label="새 비밀번호 확인"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {confirm.error ? <Alert tone="error">{confirm.error.fieldMessage('newPassword') ?? confirm.error.title}</Alert> : null}
      <Button title="비밀번호 바꾸기" onPress={onSubmit} loading={confirm.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  help: { fontSize: font.small, color: colors.textSecondary, lineHeight: 20 },
});
