import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { ErrorState } from '@/components/ui/ErrorState';
import { setUnauthorizedHandler } from '@/lib/api';
import { resetSession, sessionState, useMe } from '@/lib/auth';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/**
 * 세션 상태에 따라 보이는 화면 묶음을 바꾼다(docs/UX.md §2).
 * 이메일 인증을 마친 계정만 (app)에 들어가고, 그 전에는 (auth)의 화면만 열린다.
 */
function RootNavigator() {
  const queryClient = useQueryClient();
  const me = useMe();
  const state = sessionState(me);

  useEffect(() => {
    setUnauthorizedHandler(() => resetSession(queryClient));
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  useEffect(() => {
    if (state !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [state]);

  if (state === 'loading') {
    return null;
  }
  if (state === 'error') {
    return (
      <Screen>
        <ErrorState message={me.error?.title ?? '잠시 후 다시 시도해주세요'} onRetry={() => me.refetch()} />
      </Screen>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={state !== 'verified'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={state === 'verified'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
