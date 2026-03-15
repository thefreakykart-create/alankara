export default function ProductDetailLoading() {
  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="h-3 w-64 bg-border/30 rounded-sm mb-8 skeleton-shimmer" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery skeleton */}
          <div>
            <div className="aspect-[3/4] bg-border/30 rounded-sm skeleton-shimmer" />
            <div className="flex gap-2 mt-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-20 bg-border/30 rounded-sm skeleton-shimmer"
                />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="space-y-4">
            <div className="h-3 w-24 bg-border/30 rounded-sm skeleton-shimmer" />
            <div className="h-8 w-64 bg-border/40 rounded-sm skeleton-shimmer" />
            <div className="h-6 w-32 bg-border/30 rounded-sm skeleton-shimmer" />
            <div className="h-3 w-40 bg-border/20 rounded-sm skeleton-shimmer" />
            <div className="h-12 w-full bg-border/40 rounded-sm mt-6 skeleton-shimmer" />
          </div>
        </div>
      </div>
    </main>
  );
}
