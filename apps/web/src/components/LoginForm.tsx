"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { pendingEmail, useLogin } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [missing, setMissing] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setMissing(true);
      return;
    }
    setMissing(false);
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: ({ user }) => {
          if (user.emailVerified) {
            router.replace("/home");
          } else {
            pendingEmail.set(user.email);
            router.replace("/signup/verify");
          }
        },
      },
    );
  }

  const error = login.error;
  const lockedMinutes = error?.code === "LOGIN_TEMPORARILY_LOCKED" && error.retryAfterSeconds ? Math.ceil(error.retryAfterSeconds / 60) : null;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <TextField label="이메일" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="비밀번호" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {missing ? <Alert tone="error">이메일과 비밀번호를 입력해주세요.</Alert> : null}
      {error ? (
        <Alert tone="error">
          {error.title}
          {lockedMinutes ? ` (약 ${lockedMinutes}분 후)` : null}
        </Alert>
      ) : null}
      <Button type="submit" fullWidth loading={login.isPending}>
        로그인
      </Button>
      <div className="flex justify-between text-sm">
        <Link href="/password-reset" className="text-primary-strong underline-offset-2 hover:underline">
          비밀번호 재설정
        </Link>
        <Link href="/signup" className="font-semibold text-primary-strong underline-offset-2 hover:underline">
          가입하기
        </Link>
      </div>
    </form>
  );
}
