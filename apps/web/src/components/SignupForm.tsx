"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { CONSENT_VERSION, PASSWORD_MIN_LENGTH, pendingEmail, useSignup, type ConsentType } from "@/lib/auth";

const CONSENT_ITEMS: { type: ConsentType; label: string; required: boolean }[] = [
  { type: "TERMS", label: "서비스 이용약관 동의", required: true },
  { type: "PRIVACY", label: "개인정보 수집·이용 동의", required: true },
  { type: "SENSITIVE_HEALTH_DATA", label: "건강정보(민감정보) 처리 동의", required: true },
  { type: "MARKETING", label: "서비스 소식 받기", required: false },
];

type Errors = Partial<Record<"email" | "password" | "passwordConfirm" | "consents", string>>;

export function SignupForm() {
  const router = useRouter();
  const signup = useSignup();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState<Set<ConsentType>>(new Set());
  const [errors, setErrors] = useState<Errors>({});

  const allAgreed = CONSENT_ITEMS.every((item) => agreed.has(item.type));

  function toggle(type: ConsentType) {
    setAgreed((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!email.trim()) next.email = "이메일을 입력해주세요";
    if (password.length < PASSWORD_MIN_LENGTH) next.password = "비밀번호는 10자 이상으로 입력해주세요";
    else if (password.trim().toLowerCase() === email.trim().toLowerCase()) next.password = "이메일과 다른 비밀번호를 입력해주세요";
    if (passwordConfirm !== password) next.passwordConfirm = "비밀번호가 일치하지 않아요";
    if (CONSENT_ITEMS.some((item) => item.required && !agreed.has(item.type))) next.consents = "필수 항목에 동의해주세요";
    return next;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const normalizedEmail = email.trim();
    signup.mutate(
      {
        email: normalizedEmail,
        password,
        consents: [...agreed].map((type) => ({ type, version: CONSENT_VERSION })),
      },
      {
        onSuccess: () => {
          pendingEmail.set(normalizedEmail);
          router.push("/signup/verify");
        },
      },
    );
  }

  const serverError = signup.error;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <TextField
        label="이메일"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email ?? serverError?.fieldMessage("email")}
      />
      <TextField
        label="비밀번호"
        type="password"
        autoComplete="new-password"
        hint="10자 이상, 이메일과 다르게 입력해주세요"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password ?? serverError?.fieldMessage("password")}
      />
      <TextField
        label="비밀번호 확인"
        type="password"
        autoComplete="new-password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        error={errors.passwordConfirm}
      />

      <fieldset className="flex flex-col gap-1 rounded-[var(--radius-card)] bg-surface p-4" aria-describedby={errors.consents ? "consent-error" : undefined}>
        <legend className="sr-only">약관 동의</legend>
        <label className="flex min-h-11 items-center gap-3 border-b border-border pb-2 font-semibold">
          <input
            type="checkbox"
            className="size-5 accent-primary-strong"
            checked={allAgreed}
            onChange={() => setAgreed(allAgreed ? new Set() : new Set(CONSENT_ITEMS.map((i) => i.type)))}
          />
          전체 동의
        </label>
        {CONSENT_ITEMS.map((item) => (
          <label key={item.type} className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" className="size-5 accent-primary-strong" checked={agreed.has(item.type)} onChange={() => toggle(item.type)} />
            <span>
              <span className={item.required ? "text-primary-strong" : "text-text-secondary"}>{item.required ? "[필수]" : "[선택]"}</span> {item.label}
            </span>
          </label>
        ))}
        <p className="pt-1 text-xs text-text-secondary">약관·처리방침 전문은 법률 검토 후 게시됩니다.</p>
        {errors.consents ? (
          <p id="consent-error" className="text-sm text-error-text">
            {errors.consents}
          </p>
        ) : null}
      </fieldset>

      {serverError && serverError.errors.length === 0 ? <Alert tone="error">{serverError.title}</Alert> : null}

      <Button type="submit" fullWidth loading={signup.isPending}>
        가입하기
      </Button>
      <p className="text-center text-sm text-text-secondary">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-semibold text-primary-strong underline-offset-2 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
