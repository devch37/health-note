import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, font, space } from '@/theme';

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  /** 스택 헤더가 위쪽 안전 영역을 맡는 화면은 bottom만 준다. */
  edges?: Edge[];
};

/** 공통 화면 틀: 안전 영역, 키보드 회피, 스크롤, 최대 폭. */
export function Screen({ title, description, children, edges = ['top', 'bottom'] }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>
            {title ? (
              <Text role="heading" aria-level={1} style={styles.title}>
                {title}
              </Text>
            ) : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: space.lg, paddingVertical: space.xl },
  inner: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', gap: space.lg },
  title: { fontSize: font.title + 2, fontWeight: '700', color: colors.text },
  description: { fontSize: font.body, color: colors.textSecondary, lineHeight: 24 },
});
