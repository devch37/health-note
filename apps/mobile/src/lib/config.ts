import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 8080;

/**
 * 백엔드 주소. 배포 빌드는 EXPO_PUBLIC_API_ORIGIN으로 지정한다(앱 번들에 그대로 들어가므로 공개값만).
 * 개발 중에는 Metro 개발 서버가 떠 있는 컴퓨터(휴대폰에서 보이는 LAN 주소)의 8080 포트를 쓴다.
 */
export function resolveApiOrigin(): string {
  const explicit = process.env.EXPO_PUBLIC_API_ORIGIN;
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;
  }
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (devHost) {
    return `http://${devHost}:${BACKEND_PORT}`;
  }
  return `http://localhost:${BACKEND_PORT}`;
}
