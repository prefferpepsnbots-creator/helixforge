"use client";

export default function ServerError() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">500</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Something went wrong on our end.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
