import { StyleSheet, Text, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, font, space } from '@/theme';

export default function HomeScreen() {
  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Logo />
        <Text role="heading" aria-level={1} style={styles.title}>
          내 건강 기록을 한눈에
        </Text>
      </View>
      <Card>
        <EmptyState
          icon="document-text-outline"
          title="첫 건강검진 결과를 올려보세요"
          description="PDF나 사진(JPG, PNG)을 올리면 검사 항목을 정리해드려요. 업로드 기능은 곧 열려요."
          action={<Button title="건강검진 등록하기 (준비 중)" disabled />}
        />
      </Card>
      <Disclaimer />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
  title: { fontSize: font.title, fontWeight: '700', color: colors.text },
});
