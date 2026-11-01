import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div aria-hidden className="flex size-14 items-center justify-center rounded-full bg-[#e6f6f2] text-primary-strong">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-text">{title}</h2>
      <p className="max-w-xs text-text-secondary">{description}</p>
      {action}
    </div>
  );
}
