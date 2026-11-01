"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/lib/auth";

export function RedirectIfSignedIn() {
  const router = useRouter();
  const { data: me } = useMe();
  useEffect(() => {
    if (me?.emailVerified) {
      router.replace("/home");
    }
  }, [me, router]);
  return null;
}
