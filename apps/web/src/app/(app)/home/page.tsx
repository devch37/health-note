import { FileText } from "lucide-react";
import { Disclaimer } from "@/components/Disclaimer";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Logo />
        <h1 className="text-xl font-bold text-text">내 건강 기록을 한눈에</h1>
      </header>
      <Card>
        <EmptyState
          icon={<FileText className="size-7" />}
          title="첫 건강검진 결과를 올려보세요"
          description="PDF나 사진(JPG, PNG)을 올리면 검사 항목을 정리해드려요. 업로드 기능은 곧 열려요."
          action={<Button disabled>건강검진 등록하기 (준비 중)</Button>}
        />
      </Card>
      <Disclaimer />
    </div>
  );
}
