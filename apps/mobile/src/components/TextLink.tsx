import { Link, type Href } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { MIN_TOUCH, colors, font } from '@/theme';

/** 화면 이동 링크. 터치 영역을 최소 크기로 맞춘다. */
export function TextLink({ href, title, strong = false }: { href: Href; title: string; strong?: boolean }) {
  return (
    <Link href={href} style={styles.hit}>
      <Text style={[styles.text, strong && styles.strong]}>{title}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: MIN_TOUCH, paddingVertical: 12 },
  text: { fontSize: font.small, color: colors.primaryStrong },
  strong: { fontWeight: '700' },
});
