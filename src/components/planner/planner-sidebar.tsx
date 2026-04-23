"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, GripVertical } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { Product, ProductVariant } from "@/lib/types/product";
import { FRAME_TYPE_LABELS } from "@/lib/types/product";

interface PlannerSidebarProps {
  products: (Product & { variants: ProductVariant[] })[];
  onDragStart: (e: React.DragEvent, product: Product & { variants: ProductVariant[] }) => void;
  onTap: (product: Product & { variants: ProductVariant[] }) => void;
}

export default function PlannerSidebar({ products, onDragStart, onTap }: PlannerSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-warm-white border-r border-border">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <p className="text-xs tracking-[0.2em] uppercase text-muted mb-3">Designs</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search designs…"
            className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-sm focus:outline-none focus:border-charcoal"
          />
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 && (
          <p className="text-xs text-muted text-center py-8">No designs found</p>
        )}
        {filtered.map((product) => {
          const firstVariant = product.variants[0];
          const firstImage = firstVariant?.images?.[0] || product.images?.[0] || "";
          const frameTypes = Array.from(new Set(product.variants.map((v) => v.frame_type)));
          const minPrice = Math.min(...product.variants.map((v) => v.price));

          return (
            <div
              key={product.id}
              draggable
              onDragStart={(e) => onDragStart(e, product)}
              onClick={() => onTap(product)}
              className="flex items-center gap-3 p-2 rounded-sm border border-transparent hover:border-border hover:bg-cream cursor-grab active:cursor-grabbing transition-all group"
            >
              {/* Thumbnail */}
              <div className="relative w-12 h-14 flex-shrink-0 rounded-sm overflow-hidden bg-border">
                {firstImage && (
                  <Image
                    src={firstImage}
                    alt={product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal truncate">{product.name}</p>
                <p className="text-[10px] text-muted mt-0.5">
                  {frameTypes.map((ft) => FRAME_TYPE_LABELS[ft as keyof typeof FRAME_TYPE_LABELS]).join(" · ")}
                </p>
                <p className="text-[10px] text-terracotta mt-0.5">from {formatINR(minPrice)}</p>
              </div>

              <GripVertical className="w-3.5 h-3.5 text-muted/40 flex-shrink-0 group-hover:text-muted transition-colors" />
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-muted text-center">
          Drag to wall or tap to add
        </p>
      </div>
    </div>
  );
}
