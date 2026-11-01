import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiRequest } from './api';
import { ApiError } from './apiError';
import { tokenStore } from './tokenStore';

export type UserMe = {
  id: string;
  email: string;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'LOCKED' | 'WITHDRAWN';
  emailVerified: boolean;
  createdAt: string;
};

export type ConsentType = 'TERMS' | 'PRIVACY' | 'SENSITIVE_HEALTH_DATA' | 'MARKETING';

/** 백엔드 ConsentPolicy.CURRENT_VERSIONS와 같아야 한다. */
export const CONSENT_VERSION = '2026-10-01';

export const PASSWORD_MIN_LENGTH = 10;

export const ME_QUERY_KEY = ['me'] as const;

/** 로그인하지 않았으면 null. 저장된 토큰이 없으면 요청하지 않는다. */
export function useMe() {
  return useQuery<UserMe | null, ApiError>({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      if (!(await tokenStore.get())) {
        return null;
      }
      try {
        return await apiRequest<UserMe>('/users/me');
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          return null;
        }
        throw e;
      }
    },
    staleTime: 30_000,
  });
}

/**
 * 로그아웃·탈퇴·세션 만료 후 기기에 남은 계정 데이터를 지운다.
 * 세션 쿼리는 지우지 않고 null로 바꿔야 화면이 구독을 유지한 채 첫 화면으로 돌아간다.
 */
export async function resetSession(queryClient: QueryClient) {
  await tokenStore.clear();
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ME_QUERY_KEY[0] });
  queryClient.setQueryData(ME_QUERY_KEY, null);
}

export type SessionState = 'loading' | 'error' | 'signedOut' | 'unverified' | 'verified';

/** 한 번이라도 확인한 세션이 있으면 재조회 오류가 나도 그 상태를 유지한다. */
export function sessionState(query: ReturnType<typeof useMe>): SessionState {
  if (query.data === undefined) {
    return query.isError ? 'error' : 'loading';
  }
  if (!query.data) return 'signedOut';
  return query.data.emailVerified ? 'verified' : 'unverified';
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<{ user: UserMe }, ApiError, { email: string; password: string }>({
    mutationFn: (body) => apiRequest('/auth/login', { method: 'POST', body }),
    onSuccess: (data) => queryClient.setQueryData(ME_QUERY_KEY, data.user),
  });
}

/** 서버 세션을 끝내고, 실패해도 기기의 토큰과 캐시는 지운다. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError>({
    mutationFn: () => apiRequest('/auth/logout', { method: 'POST' }),
    onSettled: () => resetSession(queryClient),
  });
}

export function useSignup() {
  return useMutation<
    { status: string },
    ApiError,
    { email: string; password: string; consents: { type: ConsentType; version: string }[] }
  >({
    mutationFn: (body) => apiRequest('/auth/signup', { method: 'POST', body }),
  });
}

export function useConfirmEmail() {
  const queryClient = useQueryClient();
  return useMutation<{ user: UserMe }, ApiError, { email: string; code: string }>({
    mutationFn: (body) => apiRequest('/auth/email-verifications/confirm', { method: 'POST', body }),
    onSuccess: (data) => queryClient.setQueryData(ME_QUERY_KEY, data.user),
  });
}

export function useResendCode() {
  return useMutation<void, ApiError, { email: string }>({
    mutationFn: (body) => apiRequest('/auth/email-verifications/resend', { method: 'POST', body }),
  });
}

export function useRequestPasswordReset() {
  return useMutation<void, ApiError, { email: string }>({
    mutationFn: (body) => apiRequest('/auth/password-reset/request', { method: 'POST', body }),
  });
}

export function useConfirmPasswordReset() {
  return useMutation<void, ApiError, { email: string; code: string; newPassword: string }>({
    mutationFn: (body) => apiRequest('/auth/password-reset/confirm', { method: 'POST', body }),
  });
}

export function useChangePassword() {
  return useMutation<void, ApiError, { currentPassword: string; newPassword: string }>({
    mutationFn: (body) => apiRequest('/users/me/password', { method: 'PUT', body }),
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { password: string; confirmText: string }>({
    mutationFn: (body) => apiRequest('/users/me', { method: 'DELETE', body }),
    onSuccess: () => resetSession(queryClient),
  });
}
