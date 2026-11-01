import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { MIN_TOUCH, colors, font, radius, space } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading = false, disabled, ...rest }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      role="button"
      accessibilityLabel={title}
      aria-disabled={inactive}
      aria-busy={loading}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        inactive && variant !== 'ghost' ? styles.disabled : null,
        pressed && !inactive ? styles.pressed : null,
      ]}
      {...rest}>
      {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.surface : colors.text} /> : null}
      <Text style={[styles.label, labelStyles[variant], inactive && variant === 'ghost' ? styles.ghostDisabled : null]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  primary: { backgroundColor: colors.primaryStrong },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.errorText },
  disabled: { backgroundColor: colors.disabledBg, borderColor: colors.disabledBg },
  pressed: { opacity: 0.85 },
  label: { fontSize: font.body, fontWeight: '600' },
  ghostDisabled: { color: colors.textSecondary },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.surface },
  secondary: { color: colors.text },
  ghost: { color: colors.primaryStrong },
  danger: { color: colors.surface },
});
