"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useWithdraw } from "@/lib/auth";

const CONFIRM_TEXT = "탈퇴";

export function WithdrawForm() {
  const router = useRouter();
  const withdraw = useWithdraw();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 의도된 전체 새로고침: 계정 정보가 남지 않게 한다
    withdraw.mutate({ password, confirmText }, { onSuccess: () => window.location.assign("/") });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="rounded-[var(--radius-card)] bg-surface p-4 text-sm text-text">
        <p className="font-semibold">탈퇴하면 다음이 처리돼요</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-text-secondary">
          <li>계정이 즉시 비활성화되고 모든 기기에서 로그아웃돼요.</li>
          <li>이메일 주소는 계정에서 지워져 같은 이메일로 다시 가입할 수 있어요.</li>
          <li>동의 이력은 법적 보관 기준이 확정될 때까지 보관돼요.</li>
        </ul>
      </div>
      <TextField label="비밀번호" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <TextField
        label={`확인을 위해 '${CONFIRM_TEXT}'를 입력해주세요`}
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        autoComplete="off"
      />
      {withdraw.error ? <Alert tone="error">{withdraw.error.title}</Alert> : null}
      <Button type="submit" variant="danger" fullWidth loading={withdraw.isPending} disabled={!password || confirmText !== CONFIRM_TEXT}>
        탈퇴하기
      </Button>
      <Button variant="ghost" fullWidth onClick={() => router.back()}>
        취소
      </Button>
    </form>
  );
}
