import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen pt-32 pb-20 flex items-start justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <p className="font-serif text-8xl text-border mb-4">404</p>
        <h1 className="font-serif text-2xl text-charcoal tracking-wide mb-3">
          Page Not Found
        </h1>
        <p className="text-sm text-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 px-8 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-terracotta transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-11 px-8 border border-charcoal text-charcoal text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-charcoal hover:text-warm-white transition-colors"
          >
            Shop All
          </Link>
        </div>
      </div>
    </main>
  );
}
