import { AuthGuard } from "@/components/AuthGuard";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <main className="mx-auto w-full max-w-md px-4 pt-6 pb-24">{children}</main>
      <BottomNav />
    </AuthGuard>
  );
}
