import * as SecureStore from 'expo-secure-store';

/**
 * 세션 토큰 저장소. iOS Keychain·Android Keystore에만 저장하고, 기기 백업으로 옮겨지지 않게 한다
 * (docs/SECURITY.md §1). 토큰을 AsyncStorage·로그에 남기지 않는다.
 */
const KEY = 'gn.sessionToken';
const OPTIONS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const tokenStore = {
  get(): Promise<string | null> {
    return SecureStore.getItemAsync(KEY, OPTIONS);
  },
  set(token: string): Promise<void> {
    return SecureStore.setItemAsync(KEY, token, OPTIONS);
  },
  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(KEY, OPTIONS);
  },
};
