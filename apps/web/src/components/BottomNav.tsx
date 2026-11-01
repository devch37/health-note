"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, UserRound } from "lucide-react";

// 검진기록·건강변화 탭은 해당 기능이 생기는 Sprint에서 추가한다.
const tabs = [
  { href: "/home", label: "홈", icon: House },
  { href: "/me", label: "MY", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${active ? "text-primary-strong" : "text-text-secondary"}`}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
