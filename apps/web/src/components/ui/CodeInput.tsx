"use client";

import { useId } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
};

/** 숫자 인증코드 입력. 한 칸짜리 input으로 붙여넣기·자동완성(one-time-code)을 지원한다. */
export function CodeInput({ label, value, onChange, length = 6, error }: Props) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-text">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern={`\\d{${length}}`}
        maxLength={length}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`min-h-14 rounded-[var(--radius-control)] border bg-surface px-3 text-center text-2xl font-semibold tracking-[0.5em] tabular-nums ${error ? "border-error-text" : "border-border"}`}
      />
      {error ? (
        <p id={errorId} className="text-sm text-error-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
