"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          {error.digest ? `Error ID: ${error.digest}` : "An unexpected error occurred."}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
