import Link from "next/link";
import { ChartLine, FileSearch, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Disclaimer } from "@/components/Disclaimer";
import { RedirectIfSignedIn } from "./RedirectIfSignedIn";

const features = [
  { icon: FileSearch, title: "결과지에서 수치 정리", body: "PDF나 사진을 올리면 검사 항목·수치·참고범위를 정리하고, 원본과 비교해 직접 확인해요." },
  { icon: ChartLine, title: "지난 검진과 비교", body: "확인한 기록만으로 항목별 변화를 날짜·단위·참고범위와 함께 보여드려요." },
  { icon: ShieldCheck, title: "내 기록은 나만", body: "건강정보는 본인만 볼 수 있고, 언제든 내보내거나 삭제할 수 있어요." },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8">
      <RedirectIfSignedIn />
      <Logo />
      <section className="mt-12 flex flex-col gap-3">
        <h1 className="text-3xl font-bold leading-tight text-text">
          건강검진은 1년에 한 번,
          <br />
          건강관리는 매일.
        </h1>
        <p className="text-text-secondary">흩어진 건강검진 결과를 한곳에 기록하고, 해마다 달라진 점을 확인하세요.</p>
      </section>
      <ul className="mt-10 flex flex-col gap-4">
        {features.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3 rounded-[var(--radius-card)] bg-surface p-4">
            <Icon aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold text-text">{title}</h2>
              <p className="text-sm text-text-secondary">{body}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-3 pt-10">
        <Link href="/signup" className="flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-primary-strong px-4 py-3 font-semibold text-white">
          시작하기
        </Link>
        <Link href="/login" className="flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-border bg-surface px-4 py-3 font-semibold text-text">
          로그인
        </Link>
        <Disclaimer />
      </div>
    </main>
  );
}
