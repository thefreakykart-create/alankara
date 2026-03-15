"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/product";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
];

interface ProductFiltersProps {
  categories: Category[];
  totalCount: number;
}

export default function ProductFilters({
  categories,
  totalCount,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "";
  const activeSort = searchParams.get("sort") || "newest";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on filter change
      params.delete("page");
      router.push(`/products?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/products", { scroll: false });
  };

  const hasActiveFilters = activeCategory || activeSort !== "newest";

  return (
    <div className="space-y-6">
      {/* Top bar: count + sort */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-muted">
          {totalCount} {totalCount === 1 ? "product" : "products"}
        </p>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted hover:text-charcoal transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted" />
            <select
              value={activeSort}
              onChange={(e) => updateParams("sort", e.target.value)}
              className="text-sm bg-transparent border-none focus:outline-none cursor-pointer text-charcoal"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateParams("category", "")}
          className={cn(
            "px-4 py-1.5 text-xs tracking-[0.1em] uppercase border rounded-full transition-all duration-300",
            !activeCategory
              ? "bg-charcoal text-warm-white border-charcoal"
              : "bg-transparent text-charcoal border-border hover:border-charcoal"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() =>
              updateParams(
                "category",
                activeCategory === cat.slug ? "" : cat.slug
              )
            }
            className={cn(
              "px-4 py-1.5 text-xs tracking-[0.1em] uppercase border rounded-full transition-all duration-300",
              activeCategory === cat.slug
                ? "bg-charcoal text-warm-white border-charcoal"
                : "bg-transparent text-charcoal border-border hover:border-charcoal"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
