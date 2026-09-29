import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">That page is not part of the store.</p>
        <Link href="/dashboard" className="mt-4 inline-flex text-sm font-medium text-primary">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
