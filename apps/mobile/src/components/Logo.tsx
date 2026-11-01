import { StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '@/theme';

export function Logo() {
  return (
    <View style={styles.row} accessibilityLabel="검진노트" accessible>
      <View style={styles.mark} />
      <Text style={styles.text}>검진노트</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  mark: { width: 20, height: 20, borderRadius: 6, backgroundColor: colors.primary },
  text: { fontSize: font.title, fontWeight: '800', color: colors.text },
});
