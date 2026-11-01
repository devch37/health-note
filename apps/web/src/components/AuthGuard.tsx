"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { pendingEmail, useMe } from "@/lib/auth";

/**
 * 로그인·이메일 인증을 마친 사용자만 children을 본다. 실제 접근 통제는 서버가 하며 이 컴포넌트는 화면 전환용이다.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: me, isPending, isError, refetch } = useMe();

  useEffect(() => {
    if (isPending || isError) return;
    if (me === null) {
      router.replace("/login");
    } else if (!me.emailVerified) {
      pendingEmail.set(me.email);
      router.replace("/signup/verify");
    }
  }, [me, isPending, isError, router]);

  if (isError) {
    return <ErrorState message="정보를 불러오지 못했어요." onRetry={() => refetch()} />;
  }
  if (isPending || !me?.emailVerified) {
    return (
      <div className="flex flex-col gap-4 p-4" aria-busy="true" aria-label="불러오는 중">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32" />
        <Skeleton className="h-20" />
      </div>
    );
  }
  return <>{children}</>;
}
