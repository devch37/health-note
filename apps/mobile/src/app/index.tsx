import { Redirect } from 'expo-router';
import { sessionState, useMe } from '@/lib/auth';

/**
 * 첫 화면이자 보호된 화면에서 밀려났을 때 돌아오는 기준 화면.
 * 세션 상태에 맞는 화면으로 보낸다. 로딩·오류는 루트 레이아웃이 처리한다.
 */
export default function Index() {
  const state = sessionState(useMe());
  if (state === 'verified') return <Redirect href="/home" />;
  if (state === 'unverified') return <Redirect href="/verify" />;
  return <Redirect href="/welcome" />;
}
