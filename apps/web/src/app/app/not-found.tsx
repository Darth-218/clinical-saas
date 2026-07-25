import Link from "next/link";

export default function ClinicNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-600">
        The page you are looking for does not exist or has been removed.
      </p>
      <Link
        href="/app/dashboard"
        className="mt-8 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500"
      >
        Return to Dashboard
      </Link>
    </main>
  );
}
