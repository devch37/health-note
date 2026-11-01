import { WithdrawForm } from "@/components/WithdrawForm";

export default function DeleteAccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text">회원 탈퇴</h1>
      <WithdrawForm />
    </div>
  );
}
