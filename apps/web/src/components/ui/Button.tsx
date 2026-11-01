import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-primary-strong text-white hover:bg-[#066b5c] disabled:bg-[#9bb5b0]",
  secondary: "bg-surface text-text border border-border hover:bg-bg disabled:text-text-secondary",
  ghost: "bg-transparent text-primary-strong hover:bg-bg",
  danger: "bg-error-text text-white hover:bg-[#991b1b] disabled:bg-[#d8a3a3]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({ variant = "primary", loading = false, fullWidth = false, className = "", children, disabled, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-3 text-base font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
