"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"); // ✅ يوجه للـ login مباشرة
  }, [router]);

  return null; // ما يعرض أي شي
}
