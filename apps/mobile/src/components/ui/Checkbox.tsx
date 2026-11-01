import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MIN_TOUCH, colors, space } from '@/theme';

type Props = { checked: boolean; onChange: (checked: boolean) => void; label: string; children: ReactNode };

export function Checkbox({ checked, onChange, label, children }: Props) {
  return (
    <Pressable
      role="checkbox"
      aria-checked={checked}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={styles.row}>
      <View style={[styles.box, checked && styles.checked]}>
        {checked ? <Ionicons name="checkmark" size={16} color={colors.surface} /> : null}
      </View>
      <View style={styles.label}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: space.md },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: colors.primaryStrong, borderColor: colors.primaryStrong },
  label: { flex: 1 },
});
