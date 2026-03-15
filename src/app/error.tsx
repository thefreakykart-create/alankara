"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen pt-32 pb-20 flex items-start justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <h1 className="font-serif text-3xl text-charcoal tracking-wide mb-3">
          Something Went Wrong
        </h1>
        <p className="text-sm text-muted mb-8">
          We apologize for the inconvenience. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-11 px-8 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-terracotta transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-8 border border-charcoal text-charcoal text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-charcoal hover:text-warm-white transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
