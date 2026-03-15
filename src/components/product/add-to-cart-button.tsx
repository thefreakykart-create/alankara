"use client";

import { useState } from "react";
import { ShoppingBag, Check, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types/product";

export default function AddToCartButton({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const inStock = product.stock_quantity > 0;
  const maxQty = Math.min(product.stock_quantity, 10);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      quantity,
      slug: product.slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Quantity selector */}
      {inStock && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted mr-3">Qty</span>
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-9 h-9 border border-border rounded-sm flex items-center justify-center hover:border-charcoal transition-colors disabled:opacity-30"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center text-sm font-medium">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            className="w-9 h-9 border border-border rounded-sm flex items-center justify-center hover:border-charcoal transition-colors disabled:opacity-30"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        disabled={!inStock || added}
        className={cn(
          "w-full h-12 flex items-center justify-center gap-2 text-sm font-medium tracking-[0.1em] uppercase transition-all duration-300 rounded-sm",
          added
            ? "bg-emerald text-warm-white"
            : inStock
              ? "bg-charcoal text-warm-white hover:bg-terracotta"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        {added ? (
          <>
            <Check className="w-4 h-4" />
            Added to Cart
          </>
        ) : inStock ? (
          <>
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </>
        ) : (
          "Out of Stock"
        )}
      </button>
    </div>
  );
}
