"use client";

import Link from "next/link";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLogout, useMe } from "@/lib/auth";

/** 로그아웃은 전체 페이지를 새로 불러와 메모리·숨겨진 화면(Activity)에 남은 계정 정보를 지운다. */
export function MyPage() {
  const { data: me } = useMe();
  const logout = useLogout();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text">MY</h1>
      <Card className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-text-secondary">계정</h2>
        <p className="font-semibold text-text">{me?.email}</p>
        <p className="text-sm text-text-secondary">이메일 인증 완료</p>
      </Card>
      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold text-text">비밀번호 변경</h2>
        <ChangePasswordForm />
      </Card>
      {/* eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 의도된 전체 새로고침: 계정 정보가 남지 않게 한다 */}
      <Button variant="secondary" fullWidth loading={logout.isPending} onClick={() => logout.mutate(undefined, { onSettled: () => window.location.assign("/login") })}>
        로그아웃
      </Button>
      <Link href="/me/delete" className="self-center text-sm text-text-secondary underline underline-offset-2">
        회원 탈퇴
      </Link>
    </div>
  );
}
