import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Disclaimer } from '@/components/Disclaimer';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { colors, font, radius, space } from '@/theme';

const FEATURES: { icon: ComponentProps<typeof Ionicons>['name']; title: string; body: string }[] = [
  { icon: 'document-text-outline', title: '결과지에서 수치 정리', body: 'PDF나 사진을 올리면 검사 항목·수치·참고범위를 정리하고, 원본과 비교해 직접 확인해요.' },
  { icon: 'analytics-outline', title: '지난 검진과 비교', body: '확인한 기록만으로 항목별 변화를 날짜·단위·참고범위와 함께 보여드려요.' },
  { icon: 'shield-checkmark-outline', title: '내 기록은 나만', body: '건강정보는 본인만 볼 수 있고, 언제든 내보내거나 삭제할 수 있어요.' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Logo />
      <View style={styles.hero}>
        <Text role="heading" aria-level={1} style={styles.heroTitle}>
          건강검진은 1년에 한 번,{'\n'}건강관리는 매일.
        </Text>
        <Text style={styles.heroBody}>흩어진 건강검진 결과를 한곳에 기록하고, 해마다 달라진 점을 확인하세요.</Text>
      </View>
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.feature}>
            <Ionicons name={f.icon} size={24} color={colors.primary} accessibilityElementsHidden importantForAccessibility="no" />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureBody}>{f.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <Button title="시작하기" onPress={() => router.push('/signup')} />
        <Button title="로그인" variant="secondary" onPress={() => router.push('/login')} />
        <Disclaimer />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space.md, marginTop: space.xl },
  heroTitle: { fontSize: font.hero, lineHeight: 38, fontWeight: '800', color: colors.text },
  heroBody: { fontSize: font.body, lineHeight: 24, color: colors.textSecondary },
  features: { gap: space.md, marginTop: space.md },
  feature: { flexDirection: 'row', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  featureBody: { fontSize: font.small, lineHeight: 20, color: colors.textSecondary },
  actions: { marginTop: 'auto', gap: space.md, paddingTop: space.xl },
});
