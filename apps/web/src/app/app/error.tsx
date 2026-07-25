"use client";

import Link from "next/link";

export default function ClinicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-4 text-lg text-gray-600">
        The clinical dashboard encountered an error. Your data is safe.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500"
        >
          Try Again
        </button>
        <Link
          href="/app/dashboard"
          className="rounded-md bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
