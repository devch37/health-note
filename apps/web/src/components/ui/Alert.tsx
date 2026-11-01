import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "error" | "success" | "info";

const styles: Record<Tone, string> = {
  error: "bg-[#fdecec] text-error-text",
  success: "bg-[#e6f6f2] text-primary-strong",
  info: "bg-[#eaf1fe] text-info-text",
};

const icons = { error: CircleAlert, success: CircleCheck, info: Info };

/** 색만으로 의미를 전달하지 않도록 아이콘과 텍스트를 함께 쓴다. */
export function Alert({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Icon = icons[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-[var(--radius-control)] px-3 py-2.5 text-sm ${styles[tone]}`}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
