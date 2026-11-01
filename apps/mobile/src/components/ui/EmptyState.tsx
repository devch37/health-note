import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '@/theme';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text role="heading" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: font.body + 1, fontWeight: '700', color: colors.text, textAlign: 'center' },
  description: { fontSize: font.small, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  action: { alignSelf: 'stretch', marginTop: space.sm },
});
