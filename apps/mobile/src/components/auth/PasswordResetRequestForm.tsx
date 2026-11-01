import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useRequestPasswordReset } from '@/lib/auth';
import { pendingEmail } from '@/lib/pendingEmail';
import { space } from '@/theme';

export function PasswordResetRequestForm() {
  const router = useRouter();
  const request = useRequestPasswordReset();
  const [email, setEmail] = useState('');

  function onSubmit() {
    const normalized = email.trim();
    if (!normalized) return;
    request.mutate(
      { email: normalized },
      {
        onSuccess: () => {
          pendingEmail.set(normalized);
          router.push('/password-reset-confirm');
        },
      },
    );
  }

  return (
    <View style={styles.form}>
      <TextField
        label="가입한 이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      {request.error ? <Alert tone="error">{request.error.title}</Alert> : null}
      <Button title="재설정 코드 받기" onPress={onSubmit} loading={request.isPending} disabled={!email.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({ form: { gap: space.lg } });
