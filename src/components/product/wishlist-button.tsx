"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlist-store";
import { cn } from "@/lib/utils";

export default function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const toggle = useWishlistStore((s) => s.toggle);
  const saved = useWishlistStore((s) => s.has(productId));

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "w-11 h-11 flex items-center justify-center rounded-xl border-2 transition-all duration-200",
        saved
          ? "border-burgundy bg-burgundy/5 text-burgundy"
          : "border-border text-muted hover:border-charcoal hover:text-charcoal",
        className
      )}
    >
      <Heart className={cn("w-4 h-4 transition-all", saved && "fill-current")} />
    </button>
  );
}
