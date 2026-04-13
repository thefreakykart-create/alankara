"use client";

import { useState } from "react";
import { ShoppingBag, Check, Minus, Plus, Camera } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { useToast } from "@/components/ui/toast";
import { formatINR, getDiscountPercent, cn } from "@/lib/utils";
import type { ProductVariant, FrameType, FrameSize } from "@/lib/types/product";
import { FRAME_TYPE_LABELS, FRAME_SIZE_LABELS } from "@/lib/types/product";

interface WallArtAddToCartProps {
  productId: string;
  productName: string;
  productSlug: string;
  variants: ProductVariant[];
  activeFrameType: FrameType;
  activeSize: FrameSize | null;
  onTryOnWall: () => void;
}

export default function WallArtAddToCart({
  productId,
  productName,
  productSlug,
  variants,
  activeFrameType,
  activeSize,
  onTryOnWall,
}: WallArtAddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartDrawerStore((s) => s.open);
  const { toast } = useToast();

  const activeVariant = variants.find(
    (v) => v.frame_type === activeFrameType && v.size === activeSize
  );

  const inStock = activeVariant ? activeVariant.stock_quantity > 0 : false;
  const maxQty = activeVariant ? Math.min(activeVariant.stock_quantity, 10) : 0;
  const discount =
    activeVariant?.compare_at_price
      ? getDiscountPercent(activeVariant.price, activeVariant.compare_at_price)
      : 0;

  const handleAdd = () => {
    if (!activeVariant || !activeSize) return;
    addItem({
      productId,
      variantId: activeVariant.id,
      name: `${productName} — ${FRAME_TYPE_LABELS[activeFrameType]}`,
      price: activeVariant.price,
      image: activeVariant.images?.[0] || "",
      quantity,
      slug: productSlug,
      frameType: FRAME_TYPE_LABELS[activeFrameType],
      frameSize: FRAME_SIZE_LABELS[activeSize],
    });
    setAdded(true);
    toast(`${productName} (${FRAME_TYPE_LABELS[activeFrameType]}, ${FRAME_SIZE_LABELS[activeSize]}) added to cart`);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  };

  if (!activeSize) {
    return (
      <div className="space-y-3 pt-2">
        <p className="text-sm text-muted text-center py-4 border border-dashed border-border rounded-sm">
          Select a size to continue
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-medium text-charcoal">
          {activeVariant ? formatINR(activeVariant.price) : "—"}
        </span>
        {activeVariant?.compare_at_price && (
          <>
            <span className="text-base text-muted line-through">
              {formatINR(activeVariant.compare_at_price)}
            </span>
            <span className="text-xs font-medium text-burgundy tracking-wider uppercase">
              {discount}% off
            </span>
          </>
        )}
      </div>
      <p className="text-xs text-muted -mt-2">Inclusive of all taxes</p>

      {/* Stock warning */}
      {activeVariant && activeVariant.stock_quantity > 0 && activeVariant.stock_quantity <= 5 && (
        <p className="text-xs text-terracotta font-medium">
          Only {activeVariant.stock_quantity} left
        </p>
      )}

      {/* Quantity */}
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
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            className="w-9 h-9 border border-border rounded-sm flex items-center justify-center hover:border-charcoal transition-colors disabled:opacity-30"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add to Cart */}
      <button
        onClick={handleAdd}
        disabled={!inStock || added || !activeVariant}
        className={cn(
          "w-full h-13 py-4 flex items-center justify-center gap-2 text-sm font-medium tracking-[0.12em] uppercase transition-all duration-300 rounded-sm",
          added
            ? "bg-emerald text-warm-white"
            : inStock && activeVariant
            ? "bg-charcoal text-warm-white hover:bg-terracotta"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        {added ? (
          <><Check className="w-4 h-4" /> Added to Cart</>
        ) : inStock ? (
          <><ShoppingBag className="w-4 h-4" /> Add to Cart</>
        ) : (
          "Out of Stock"
        )}
      </button>

      {/* Try On My Wall */}
      <button
        onClick={onTryOnWall}
        className="w-full py-3 flex items-center justify-center gap-2 text-sm tracking-[0.1em] uppercase border border-border text-charcoal hover:border-charcoal hover:bg-cream transition-all rounded-sm"
      >
        <Camera className="w-4 h-4" />
        Try On My Wall
      </button>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border rounded-sm p-3 text-center">
          <p className="text-xs text-muted">Free Shipping</p>
          <p className="text-xs text-charcoal font-medium">Above ₹999</p>
        </div>
        <div className="border border-border rounded-sm p-3 text-center">
          <p className="text-xs text-muted">Easy Returns</p>
          <p className="text-xs text-charcoal font-medium">7 Days</p>
        </div>
      </div>
    </div>
  );
}
