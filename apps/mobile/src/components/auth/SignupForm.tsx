import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TextLink } from '@/components/TextLink';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { TextField } from '@/components/ui/TextField';
import { CONSENT_VERSION, PASSWORD_MIN_LENGTH, useSignup, type ConsentType } from '@/lib/auth';
import { pendingEmail } from '@/lib/pendingEmail';
import { colors, font, radius, space } from '@/theme';

const CONSENT_ITEMS: { type: ConsentType; label: string; required: boolean }[] = [
  { type: 'TERMS', label: '서비스 이용약관 동의', required: true },
  { type: 'PRIVACY', label: '개인정보 수집·이용 동의', required: true },
  { type: 'SENSITIVE_HEALTH_DATA', label: '건강정보(민감정보) 처리 동의', required: true },
  { type: 'MARKETING', label: '서비스 소식 받기', required: false },
];

type Errors = Partial<Record<'email' | 'password' | 'passwordConfirm' | 'consents', string>>;

export function SignupForm() {
  const router = useRouter();
  const signup = useSignup();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreed, setAgreed] = useState<Set<ConsentType>>(new Set());
  const [errors, setErrors] = useState<Errors>({});

  const allAgreed = CONSENT_ITEMS.every((item) => agreed.has(item.type));

  function toggle(type: ConsentType) {
    setAgreed((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!email.trim()) next.email = '이메일을 입력해주세요';
    if (password.length < PASSWORD_MIN_LENGTH) next.password = '비밀번호는 10자 이상으로 입력해주세요';
    else if (password.trim().toLowerCase() === email.trim().toLowerCase()) next.password = '이메일과 다른 비밀번호를 입력해주세요';
    if (passwordConfirm !== password) next.passwordConfirm = '비밀번호가 일치하지 않아요';
    if (CONSENT_ITEMS.some((item) => item.required && !agreed.has(item.type))) next.consents = '필수 항목에 동의해주세요';
    return next;
  }

  function onSubmit() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const normalizedEmail = email.trim();
    signup.mutate(
      { email: normalizedEmail, password, consents: [...agreed].map((type) => ({ type, version: CONSENT_VERSION })) },
      {
        onSuccess: () => {
          pendingEmail.set(normalizedEmail);
          router.push('/verify');
        },
      },
    );
  }

  const serverError = signup.error;

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
        error={errors.email ?? serverError?.fieldMessage('email')}
      />
      <TextField
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint="10자 이상, 이메일과 다르게 입력해주세요"
        error={errors.password ?? serverError?.fieldMessage('password')}
      />
      <TextField
        label="비밀번호 확인"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        error={errors.passwordConfirm}
      />

      <View style={styles.consents}>
        <Checkbox
          label="전체 동의"
          checked={allAgreed}
          onChange={() => setAgreed(allAgreed ? new Set() : new Set(CONSENT_ITEMS.map((i) => i.type)))}>
          <Text style={styles.allLabel}>전체 동의</Text>
        </Checkbox>
        <View style={styles.divider} />
        {CONSENT_ITEMS.map((item) => (
          <Checkbox
            key={item.type}
            label={`${item.required ? '필수' : '선택'} ${item.label}`}
            checked={agreed.has(item.type)}
            onChange={() => toggle(item.type)}>
            <Text style={styles.itemLabel}>
              <Text style={item.required ? styles.required : styles.optional}>{item.required ? '[필수]' : '[선택]'}</Text>{' '}
              {item.label}
            </Text>
          </Checkbox>
        ))}
        <Text style={styles.note}>약관·처리방침 전문은 법률 검토 후 게시됩니다.</Text>
        {errors.consents ? (
          <Text role="alert" style={styles.error}>
            {errors.consents}
          </Text>
        ) : null}
      </View>

      {serverError && serverError.errors.length === 0 ? <Alert tone="error">{serverError.title}</Alert> : null}

      <Button title="가입하기" onPress={onSubmit} loading={signup.isPending} />
      <View style={styles.footer}>
        <Text style={styles.footerText}>이미 계정이 있나요?</Text>
        <TextLink href="/login" title="로그인" strong />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  consents: { backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: space.lg, paddingVertical: space.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.xs },
  allLabel: { fontSize: font.body, fontWeight: '700', color: colors.text },
  itemLabel: { fontSize: font.small, color: colors.text },
  required: { color: colors.primaryStrong, fontWeight: '600' },
  optional: { color: colors.textSecondary },
  note: { fontSize: font.caption, color: colors.textSecondary, paddingVertical: space.sm },
  error: { fontSize: font.small, color: colors.errorText, paddingBottom: space.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.sm },
  footerText: { fontSize: font.small, color: colors.textSecondary },
});
