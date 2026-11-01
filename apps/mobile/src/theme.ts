/**
 * 디자인 토큰(docs/UX.md §6). 웹(apps/web/src/app/globals.css)과 같은 값을 쓴다.
 * primary는 대비가 낮아(2.51:1) 글자색·버튼 배경으로 쓰지 않는다.
 */
export const colors = {
  primary: '#18B89A',
  primaryStrong: '#087F6D',
  bg: '#F7F9FA',
  surface: '#FFFFFF',
  text: '#172B3A',
  textSecondary: '#5E6E7E',
  border: '#DFE5EA',
  infoText: '#1D4ED8',
  infoBg: '#EFF6FF',
  successText: '#087F6D',
  successBg: '#E8F7F3',
  errorText: '#B91C1C',
  errorBg: '#FEF2F2',
  disabledBg: '#C9D2D9',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { card: 16, control: 12 } as const;

export const font = {
  body: 16,
  small: 14,
  caption: 12,
  title: 20,
  hero: 28,
} as const;

/** 터치 타깃 최소 크기(iOS 44pt, Android 48dp 중 큰 값). */
export const MIN_TOUCH = 48;
