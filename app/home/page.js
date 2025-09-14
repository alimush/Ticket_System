"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    // جلب اليوزر من localStorage
    const user = localStorage.getItem("username");
    if (!user) {
      router.push("/"); // إذا ماكو يوزر يرجع للوغن
    } else {
      setUsername(user);
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">
          👋 أهلاً {username}
        </h1>
        <p className="text-gray-600">
          تم تسجيل الدخول بنجاح. هذه صفحة الـ Home.
        </p>

        <button
          onClick={() => {
            localStorage.removeItem("username");
            window.dispatchEvent(new Event("userChanged"));
            router.push("/"); // يرجع للوغن
          }}
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
        >
          تسجيل خروج
        </button>
      </div>
    </div>
  );
}
