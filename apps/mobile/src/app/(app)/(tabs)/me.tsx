import { StyleSheet, Text } from 'react-native';
import { ChangePasswordForm } from '@/components/me/ChangePasswordForm';
import { Screen } from '@/components/Screen';
import { TextLink } from '@/components/TextLink';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLogout, useMe } from '@/lib/auth';
import { colors, font } from '@/theme';

/** 로그아웃하면 세션 상태가 비워지고 보호된 화면 규칙에 따라 첫 화면으로 돌아간다. */
export default function MyScreen() {
  const { data: me } = useMe();
  const logout = useLogout();

  return (
    <Screen title="MY" edges={['top']}>
      <Card>
        <Text style={styles.sectionLabel}>계정</Text>
        <Text style={styles.email}>{me?.email}</Text>
        <Text style={styles.sub}>이메일 인증 완료</Text>
      </Card>
      <Card>
        <Text role="heading" style={styles.sectionTitle}>
          비밀번호 변경
        </Text>
        <ChangePasswordForm />
      </Card>
      <Button title="로그아웃" variant="secondary" loading={logout.isPending} onPress={() => logout.mutate()} />
      <TextLink href="/withdraw" title="회원 탈퇴" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: font.small, fontWeight: '600', color: colors.textSecondary },
  sectionTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  email: { fontSize: font.body, fontWeight: '600', color: colors.text },
  sub: { fontSize: font.small, color: colors.textSecondary },
});
