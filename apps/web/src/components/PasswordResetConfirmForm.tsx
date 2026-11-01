"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CodeInput } from "@/components/ui/CodeInput";
import { TextField } from "@/components/ui/TextField";
import { PASSWORD_MIN_LENGTH, pendingEmail, useConfirmPasswordReset } from "@/lib/auth";

export function PasswordResetConfirmForm() {
  const confirm = useConfirmPasswordReset();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = pendingEmail.get();
    // sessionStorage는 클라이언트에서만 읽을 수 있어 마운트 후 반영한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setEmail(stored);
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || code.length !== 6) return setError("이메일과 재설정 코드 6자리를 입력해주세요");
    if (password.length < PASSWORD_MIN_LENGTH) return setError("비밀번호는 10자 이상으로 입력해주세요");
    if (password !== passwordConfirm) return setError("비밀번호가 일치하지 않아요");
    setError(null);
    confirm.mutate({ email: email.trim(), code, newPassword: password }, { onSuccess: () => pendingEmail.clear() });
  }

  if (confirm.isSuccess) {
    return (
      <div className="flex flex-col gap-5">
        <Alert tone="success">비밀번호를 바꿨어요. 다른 기기의 로그인은 모두 해제됐어요.</Alert>
        <Link href="/login" className="flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-primary-strong px-4 py-3 font-semibold text-white">
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">가입된 이메일이라면 재설정 코드를 보냈어요. 코드는 30분 동안 유효해요.</p>
      <TextField label="가입한 이메일" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <CodeInput label="재설정 코드 6자리" value={code} onChange={setCode} />
      <TextField label="새 비밀번호" type="password" autoComplete="new-password" hint="10자 이상" value={password} onChange={(e) => setPassword(e.target.value)} />
      <TextField label="새 비밀번호 확인" type="password" autoComplete="new-password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {confirm.error ? <Alert tone="error">{confirm.error.fieldMessage("newPassword") ?? confirm.error.title}</Alert> : null}
      <Button type="submit" fullWidth loading={confirm.isPending}>
        비밀번호 바꾸기
      </Button>
    </form>
  );
}
