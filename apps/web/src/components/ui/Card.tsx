import type { HTMLAttributes } from "react";

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-[var(--radius-card)] bg-surface p-5 shadow-[0_1px_2px_rgba(23,43,58,0.06)] ${className}`} {...rest} />;
}
