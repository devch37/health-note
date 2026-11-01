import { StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '@/theme';
import { Button } from './Button';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View role="alert" style={styles.wrap}>
      <Text style={styles.title}>불러오지 못했어요</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button title="다시 시도" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md, alignItems: 'stretch', paddingVertical: space.xl },
  title: { fontSize: font.body + 1, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: font.small, color: colors.textSecondary, textAlign: 'center' },
});
