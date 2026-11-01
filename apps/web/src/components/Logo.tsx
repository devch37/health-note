import { NotebookPen } from "lucide-react";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-lg font-bold text-text">
      <NotebookPen aria-hidden className="size-6 text-primary" />
      검진노트
    </span>
  );
}
