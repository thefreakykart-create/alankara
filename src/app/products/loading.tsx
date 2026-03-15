export default function ProductsLoading() {
  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-10">
          <div className="h-9 w-48 bg-border/50 rounded-sm skeleton-shimmer" />
          <div className="h-4 w-80 bg-border/30 rounded-sm mt-3 skeleton-shimmer" />
        </div>

        {/* Filter skeleton */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 bg-border/30 rounded-full skeleton-shimmer"
            />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-6 lg:gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] bg-border/30 rounded-sm skeleton-shimmer" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-16 bg-border/30 rounded-sm skeleton-shimmer" />
                <div className="h-4 w-32 bg-border/40 rounded-sm skeleton-shimmer" />
                <div className="h-4 w-20 bg-border/30 rounded-sm skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
