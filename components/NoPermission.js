"use client";

export default function NoPermission() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-lg font-semibold text-gray-600">
        🚫 You don&apos;t have permission to view this page.
      </p>
    </div>
  );
}