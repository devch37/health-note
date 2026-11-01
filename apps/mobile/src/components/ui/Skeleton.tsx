import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';

/** 로딩 자리 표시. 화면 낭독기에는 "불러오는 중"으로 읽힌다. */
export function Skeleton({ height = 80 }: { height?: number }) {
  return <View accessibilityLabel="불러오는 중" aria-busy style={[styles.block, { height }]} />;
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.border, borderRadius: radius.card, opacity: 0.6 },
});
