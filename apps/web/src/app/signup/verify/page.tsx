import { AuthShell } from "@/components/AuthShell";
import { VerifyEmailForm } from "@/components/VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <AuthShell title="이메일 인증" description="메일로 받은 6자리 인증코드를 입력해주세요.">
      <VerifyEmailForm />
    </AuthShell>
  );
}
