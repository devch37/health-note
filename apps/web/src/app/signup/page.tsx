import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell title="가입하기" description="이메일로 가입하고 인증코드를 확인해주세요.">
      <SignupForm />
    </AuthShell>
  );
}
