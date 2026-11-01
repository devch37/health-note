/**
 * 브라우저 미리보기(npx expo start --web)용. 브라우저 저장소에 토큰을 두지 않고 메모리에만 둔다.
 * 새로고침하면 로그아웃된다.
 */
let token: string | null = null;

export const tokenStore = {
  async get(): Promise<string | null> {
    return token;
  },
  async set(value: string): Promise<void> {
    token = value;
  },
  async clear(): Promise<void> {
    token = null;
  },
};
