import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextLink } from '@/components/TextLink';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useLogin } from '@/lib/auth';
import { space } from '@/theme';

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [missing, setMissing] = useState(false);

  function onSubmit() {
    if (!email.trim() || !password) {
      setMissing(true);
      return;
    }
    setMissing(false);
    // 인증 완료 계정은 세션 상태가 바뀌며 홈으로 이동한다. 미인증 계정은 인증 화면으로 보낸다.
    login.mutate(
      { email: email.trim(), password },
      { onSuccess: ({ user }) => (user.emailVerified ? undefined : router.replace('/verify')) },
    );
  }

  const error = login.error;
  const lockedMinutes =
    error?.code === 'LOGIN_TEMPORARILY_LOCKED' && error.retryAfterSeconds ? Math.ceil(error.retryAfterSeconds / 60) : null;

  return (
    <View style={styles.form}>
      <TextField
        label="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextField
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      {missing ? <Alert tone="error">이메일과 비밀번호를 입력해주세요.</Alert> : null}
      {error ? (
        <Alert tone="error">
          {error.title}
          {lockedMinutes ? ` (약 ${lockedMinutes}분 후)` : null}
        </Alert>
      ) : null}
      <Button title="로그인" onPress={onSubmit} loading={login.isPending} />
      <View style={styles.links}>
        <TextLink href="/password-reset" title="비밀번호 재설정" />
        <TextLink href="/signup" title="가입하기" strong />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  links: { flexDirection: 'row', justifyContent: 'space-between' },
});
