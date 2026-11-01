import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CodeInput } from '@/components/ui/CodeInput';
import { TextField } from '@/components/ui/TextField';
import { useConfirmEmail, useLogout, useMe, useResendCode } from '@/lib/auth';
import { pendingEmail } from '@/lib/pendingEmail';
import { colors, font, radius, space } from '@/theme';

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailForm() {
  const router = useRouter();
  const me = useMe();
  const confirm = useConfirmEmail();
  const resend = useResendCode();
  const logout = useLogout();
  // 로그인했지만 인증하지 않은 계정은 세션의 이메일을, 가입 직후에는 가입 화면에서 넘긴 이메일을 쓴다.
  const knownEmail = me.data?.email ?? pendingEmail.get();
  const [typedEmail, setTypedEmail] = useState('');
  const email = knownEmail ?? typedEmail.trim();
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function onSubmit() {
    if (code.length !== 6 || !email) return;
    // 성공하면 세션 상태가 '인증 완료'로 바뀌고 보호된 화면 규칙에 따라 홈으로 이동한다.
    confirm.mutate({ email, code }, { onSuccess: () => pendingEmail.clear() });
  }

  function onResend() {
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          setResent(true);
          setCooldown(RESEND_COOLDOWN_SECONDS);
        },
      },
    );
  }

  return (
    <View style={styles.form}>
      {knownEmail ? (
        <View style={styles.sentTo}>
          <Text style={styles.sentLabel}>보낸 주소</Text>
          <Text style={styles.sentEmail}>{knownEmail}</Text>
        </View>
      ) : (
        <TextField
          label="가입한 이메일"
          value={typedEmail}
          onChangeText={setTypedEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      )}
      <CodeInput label="인증코드 6자리" value={code} onChangeText={setCode} error={confirm.error?.title} />
      <Text style={styles.help}>메일이 오지 않았다면 스팸함을 확인해주세요. 코드는 10분 동안 유효해요.</Text>

      {resent ? <Alert tone="success">가입된 계정이라면 새 인증코드를 보냈어요.</Alert> : null}
      {resend.error ? <Alert tone="error">{resend.error.title}</Alert> : null}

      <Button title="인증하기" onPress={onSubmit} loading={confirm.isPending} disabled={code.length !== 6 || !email} />
      <Button
        title={cooldown > 0 ? `인증코드 다시 받기 (${cooldown}초)` : '인증코드 다시 받기'}
        variant="ghost"
        onPress={onResend}
        disabled={cooldown > 0 || !email}
        loading={resend.isPending}
      />
      {me.data ? (
        <Button
          title="다른 계정으로 로그인"
          variant="ghost"
          loading={logout.isPending}
          onPress={() => logout.mutate(undefined, { onSettled: () => router.replace('/login') })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  sentTo: { backgroundColor: colors.surface, borderRadius: radius.control, padding: space.md, gap: 2 },
  sentLabel: { fontSize: font.small, color: colors.textSecondary },
  sentEmail: { fontSize: font.body, fontWeight: '600', color: colors.text },
  help: { fontSize: font.small, color: colors.textSecondary, lineHeight: 20 },
});
