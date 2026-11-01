import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useWithdraw } from '@/lib/auth';
import { colors, font, radius, space } from '@/theme';

const CONFIRM_TEXT = '탈퇴';

const CONSEQUENCES = [
  '계정이 즉시 비활성화되고 모든 기기에서 로그아웃돼요.',
  '이메일 주소는 계정에서 지워져 같은 이메일로 다시 가입할 수 있어요.',
  '동의 이력은 법적 보관 기준이 확정될 때까지 보관돼요.',
];

/** 탈퇴에 성공하면 세션 상태가 비워지고 보호된 화면 규칙에 따라 첫 화면으로 돌아간다. */
export function WithdrawForm() {
  const router = useRouter();
  const withdraw = useWithdraw();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');

  return (
    <View style={styles.form}>
      <View style={styles.box}>
        <Text style={styles.boxTitle}>탈퇴하면 다음이 처리돼요</Text>
        {CONSEQUENCES.map((line) => (
          <Text key={line} style={styles.item}>
            • {line}
          </Text>
        ))}
      </View>
      <TextField label="비밀번호" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
      <TextField
        label={`확인을 위해 '${CONFIRM_TEXT}'를 입력해주세요`}
        value={confirmText}
        onChangeText={setConfirmText}
        autoComplete="off"
        autoCorrect={false}
      />
      {withdraw.error ? <Alert tone="error">{withdraw.error.title}</Alert> : null}
      <Button
        title="탈퇴하기"
        variant="danger"
        loading={withdraw.isPending}
        disabled={!password || confirmText !== CONFIRM_TEXT}
        onPress={() => withdraw.mutate({ password, confirmText })}
      />
      <Button title="취소" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  box: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg, gap: space.xs },
  boxTitle: { fontSize: font.body, fontWeight: '700', color: colors.text, marginBottom: space.xs },
  item: { fontSize: font.small, color: colors.textSecondary, lineHeight: 20 },
});
