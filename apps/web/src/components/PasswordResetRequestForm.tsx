"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { pendingEmail, useRequestPasswordReset } from "@/lib/auth";

export function PasswordResetRequestForm() {
  const router = useRouter();
  const request = useRequestPasswordReset();
  const [email, setEmail] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    request.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          pendingEmail.set(email.trim());
          router.push("/password-reset/confirm");
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <TextField label="가입한 이메일" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {request.error ? <Alert tone="error">{request.error.title}</Alert> : null}
      <Button type="submit" fullWidth loading={request.isPending} disabled={!email.trim()}>
        재설정 코드 받기
      </Button>
    </form>
  );
}
