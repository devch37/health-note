/**
 * 가입 → 인증, 재설정 요청 → 재설정 화면으로 이메일을 넘길 때 쓴다.
 * 라우트 파라미터(웹에서는 URL)에 이메일을 넣지 않기 위해 메모리에만 둔다(docs/UX.md §2).
 */
let value: string | null = null;

export const pendingEmail = {
  set(email: string) {
    value = email;
  },
  get(): string | null {
    return value;
  },
  clear() {
    value = null;
  },
};
