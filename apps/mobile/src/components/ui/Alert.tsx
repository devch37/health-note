import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from '@/theme';

type Tone = 'info' | 'success' | 'error';

/** 결과·오류 안내. 오류는 화면 낭독기가 바로 읽도록 alert 역할을 준다. */
export function Alert({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <View
      role={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: palette[tone].bg }]}>
      <Text style={[styles.text, { color: palette[tone].text }]}>{children}</Text>
    </View>
  );
}

const palette = {
  info: { bg: colors.infoBg, text: colors.infoText },
  success: { bg: colors.successBg, text: colors.successText },
  error: { bg: colors.errorBg, text: colors.errorText },
} as const;

const styles = StyleSheet.create({
  box: { borderRadius: radius.control, paddingHorizontal: space.md, paddingVertical: space.md },
  text: { fontSize: font.small, lineHeight: 20 },
});
