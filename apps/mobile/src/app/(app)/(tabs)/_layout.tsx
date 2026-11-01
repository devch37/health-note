import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { colors } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return <Ionicons name={name} size={size} color={focused ? colors.primaryStrong : colors.textSecondary} />;
  };
}

/** 하단 탭(docs/UX.md §2). 검진기록·건강변화 탭은 해당 Sprint에서 추가한다. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryStrong,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen
        name="home"
        options={{ title: '홈', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="me"
        options={{ title: 'MY', tabBarIcon: tabIcon('person-outline') }}
      />
    </Tabs>
  );
}
