"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold text-ink">We couldn&apos;t load the family tree</h1>
      <p className="mt-3 text-muted">The database is unavailable right now. Please try again in a moment.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-dark"
      >
        Try again
      </button>
    </main>
  );
}
