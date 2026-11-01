import { StyleSheet, Text } from 'react-native';
import { colors, font } from '@/theme';

/** 모든 결과 화면에 두는 고정 안내(docs/SECURITY.md §9). */
export function Disclaimer() {
  return (
    <Text style={styles.text}>
      검진노트는 기록을 정리해 보여주는 서비스이며 의료적 진단을 하지 않아요. 결과 해석은 의료진과 상담하세요.
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: font.small, color: colors.textSecondary, lineHeight: 20 },
});
