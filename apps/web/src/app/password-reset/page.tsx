import { AuthShell } from "@/components/AuthShell";
import { PasswordResetRequestForm } from "@/components/PasswordResetRequestForm";

export default function PasswordResetPage() {
  return (
    <AuthShell title="비밀번호 재설정" description="가입한 이메일로 재설정 링크를 보내드려요.">
      <PasswordResetRequestForm />
    </AuthShell>
  );
}
