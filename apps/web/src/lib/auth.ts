"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiRequest } from "./api";

export type UserMe = {
  id: string;
  email: string;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "LOCKED" | "WITHDRAWN";
  emailVerified: boolean;
  createdAt: string;
};

export type ConsentType = "TERMS" | "PRIVACY" | "SENSITIVE_HEALTH_DATA" | "MARKETING";

/** 백엔드 ConsentPolicy.CURRENT_VERSIONS와 같아야 한다. */
export const CONSENT_VERSION = "2026-10-01";

export const ME_QUERY_KEY = ["me"] as const;

/** 로그인하지 않았으면 null. */
export function useMe() {
  return useQuery<UserMe | null, ApiError>({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        return await apiRequest<UserMe>("/users/me");
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

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<{ user: UserMe }, ApiError, { email: string; password: string }>({
    mutationFn: (body) => apiRequest("/auth/login", { method: "POST", body }),
    onSuccess: (data) => queryClient.setQueryData(ME_QUERY_KEY, data.user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError>({
    mutationFn: () => apiRequest("/auth/logout", { method: "POST" }),
    onSettled: () => queryClient.clear(),
  });
}

export function useSignup() {
  return useMutation<
    { status: string },
    ApiError,
    { email: string; password: string; consents: { type: ConsentType; version: string }[] }
  >({
    mutationFn: (body) => apiRequest("/auth/signup", { method: "POST", body }),
  });
}

export function useConfirmEmail() {
  const queryClient = useQueryClient();
  return useMutation<{ user: UserMe }, ApiError, { email: string; code: string }>({
    mutationFn: (body) => apiRequest("/auth/email-verifications/confirm", { method: "POST", body }),
    onSuccess: (data) => queryClient.setQueryData(ME_QUERY_KEY, data.user),
  });
}

export function useResendCode() {
  return useMutation<void, ApiError, { email: string }>({
    mutationFn: (body) => apiRequest("/auth/email-verifications/resend", { method: "POST", body }),
  });
}

export function useRequestPasswordReset() {
  return useMutation<void, ApiError, { email: string }>({
    mutationFn: (body) => apiRequest("/auth/password-reset/request", { method: "POST", body }),
  });
}

export function useConfirmPasswordReset() {
  return useMutation<void, ApiError, { email: string; code: string; newPassword: string }>({
    mutationFn: (body) => apiRequest("/auth/password-reset/confirm", { method: "POST", body }),
  });
}

export function useChangePassword() {
  return useMutation<void, ApiError, { currentPassword: string; newPassword: string }>({
    mutationFn: (body) => apiRequest("/users/me/password", { method: "PUT", body }),
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { password: string; confirmText: string }>({
    mutationFn: (body) => apiRequest("/users/me", { method: "DELETE", body }),
    onSuccess: () => queryClient.clear(),
  });
}

/**
 * 가입 → 인증 화면, 재설정 요청 → 재설정 화면으로 이메일을 넘길 때 URL에 넣지 않기 위해 sessionStorage를 쓴다(docs/SECURITY.md, 개인정보 URL 노출 금지).
 */
const PENDING_EMAIL_KEY = "gn.pendingEmail";

export const pendingEmail = {
  set(email: string) {
    try {
      sessionStorage.setItem(PENDING_EMAIL_KEY, email);
    } catch {
      // 저장소를 쓸 수 없으면 인증 화면에서 이메일을 다시 입력받는다.
    }
  },
  get(): string | null {
    try {
      return sessionStorage.getItem(PENDING_EMAIL_KEY);
    } catch {
      return null;
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
    } catch {
      // 무시
    }
  },
};

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
