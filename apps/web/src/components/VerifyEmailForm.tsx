"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CodeInput } from "@/components/ui/CodeInput";
import { TextField } from "@/components/ui/TextField";
import { pendingEmail, useConfirmEmail, useResendCode } from "@/lib/auth";

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailForm() {
  const router = useRouter();
  const confirm = useConfirmEmail();
  const resend = useResendCode();
  const [email, setEmail] = useState("");
  const [knownEmail, setKnownEmail] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const stored = pendingEmail.get();
    if (stored) {
      // sessionStorage는 클라이언트에서만 읽을 수 있어 마운트 후 반영한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(stored);
      setKnownEmail(true);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6 || !email) return;
    confirm.mutate(
      { email: email.trim(), code },
      {
        onSuccess: () => {
          pendingEmail.clear();
          router.replace("/home");
        },
      },
    );
  }

  function onResend() {
    resend.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          setResent(true);
          setCooldown(RESEND_COOLDOWN_SECONDS);
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {knownEmail ? (
        <p className="rounded-[var(--radius-control)] bg-surface px-3 py-2.5 text-text">
          <span className="text-text-secondary">보낸 주소 </span>
          <span className="font-semibold">{email}</span>
        </p>
      ) : (
        <TextField label="가입한 이메일" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      )}
      <CodeInput label="인증코드 6자리" value={code} onChange={setCode} error={confirm.error?.title} />
      <p className="text-sm text-text-secondary">메일이 오지 않았다면 스팸함을 확인해주세요. 코드는 10분 동안 유효해요.</p>

      {resent ? <Alert tone="success">가입된 계정이라면 새 인증코드를 보냈어요.</Alert> : null}
      {resend.error ? <Alert tone="error">{resend.error.title}</Alert> : null}

      <Button type="submit" fullWidth loading={confirm.isPending} disabled={code.length !== 6 || !email}>
        인증하기
      </Button>
      <Button variant="ghost" fullWidth onClick={onResend} disabled={cooldown > 0 || !email} loading={resend.isPending}>
        {cooldown > 0 ? `인증코드 다시 받기 (${cooldown}초)` : "인증코드 다시 받기"}
      </Button>
    </form>
  );
}
