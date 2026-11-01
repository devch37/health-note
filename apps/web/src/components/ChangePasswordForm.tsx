"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PASSWORD_MIN_LENGTH, useChangePassword } from "@/lib/auth";

export function ChangePasswordForm() {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!current) return setError("현재 비밀번호를 입력해주세요");
    if (next.length < PASSWORD_MIN_LENGTH) return setError("새 비밀번호는 10자 이상으로 입력해주세요");
    setError(null);
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextField label="현재 비밀번호" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <TextField label="새 비밀번호" type="password" autoComplete="new-password" hint="10자 이상" value={next} onChange={(e) => setNext(e.target.value)} />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {change.error ? <Alert tone="error">{change.error.fieldMessage("newPassword") ?? change.error.title}</Alert> : null}
      {change.isSuccess ? <Alert tone="success">비밀번호를 바꿨어요. 다른 기기의 로그인은 해제됐어요.</Alert> : null}
      <Button type="submit" variant="secondary" loading={change.isPending}>
        비밀번호 변경
      </Button>
    </form>
  );
}
