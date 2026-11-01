import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { PasswordResetConfirmForm } from "@/components/PasswordResetConfirmForm";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PasswordResetConfirmPage() {
  return (
    <AuthShell title="새 비밀번호 설정">
      <Suspense fallback={<Skeleton className="h-40" />}>
        <PasswordResetConfirmForm />
      </Suspense>
    </AuthShell>
  );
}
