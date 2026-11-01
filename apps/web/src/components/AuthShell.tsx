import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AuthShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8">
      <Link href="/" className="self-start">
        <Logo />
      </Link>
      <div className="mt-10 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {description ? <p className="text-text-secondary">{description}</p> : null}
      </div>
      <div className="mt-8">{children}</div>
    </main>
  );
}
