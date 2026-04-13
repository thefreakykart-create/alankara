"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import ProductGallery from "@/components/product/product-gallery";
import FrameCompareSlider from "@/components/product/frame-compare-slider";
import SizeSelector from "@/components/product/size-selector";
import WallArtAddToCart from "@/components/product/wall-art-add-to-cart";
import MaterialCloseup from "@/components/product/material-closeup";
import ProductDetailsAccordion from "@/components/product/product-details-accordion";
import ProductCard from "@/components/product/product-card";
import TryOnWallModal from "@/components/product/try-on-wall-modal";
import type { Product, ProductVariant, FrameType, FrameSize } from "@/lib/types/product";
import { FRAME_TYPE_LABELS } from "@/lib/types/product";

interface WallArtProductProps {
  product: Product;
  variants: ProductVariant[];
  related: Product[];
}

export default function WallArtProduct({ product, variants, related }: WallArtProductProps) {
  const activeVariants = variants.filter((v) => v.is_active);

  // Default to first available frame type + size
  const defaultFrameType = activeVariants[0]?.frame_type as FrameType ?? "canvas";
  const defaultSize = activeVariants.find((v) => v.frame_type === defaultFrameType)?.size as FrameSize ?? null;

  const [activeFrameType, setActiveFrameType] = useState<FrameType>(defaultFrameType);
  const [activeSize, setActiveSize] = useState<FrameSize | null>(defaultSize);
  const [showAR, setShowAR] = useState(false);

  const handleFrameChange = useCallback((ft: FrameType) => {
    setActiveFrameType(ft);
    // reset size to first available for new frame type
    const firstSize = activeVariants.find((v) => v.frame_type === ft)?.size as FrameSize ?? null;
    setActiveSize(firstSize);
  }, [activeVariants]);

  // Images for the active frame type
  const activeImages = activeVariants
    .filter((v) => v.frame_type === activeFrameType)
    .flatMap((v) => v.images)
    .filter(Boolean);

  // Fallback to product images if no variant images
  const galleryImages = activeImages.length > 0 ? activeImages : product.images ?? [];

  const availableFrameTypes = Array.from(
    new Set(activeVariants.map((v) => v.frame_type))
  ) as FrameType[];

  return (
    <>
      <main className="min-h-screen pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-xs text-muted tracking-wide">
            <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-charcoal transition-colors">Shop</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-charcoal transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-charcoal">{product.name}</span>
          </nav>

          {/* ── Main product section ── */}
          <div className="space-y-10">

            {/* Gallery + Info stacked (mobile) / side by side (desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

              {/* Left: Gallery (images change with frame type) */}
              <div className="space-y-4">
                <ProductGallery images={galleryImages} />

                {/* Frame compare slider — shown below gallery */}
                {availableFrameTypes.length > 1 && (
                  <FrameCompareSlider
                    variants={activeVariants}
                    activeFrameType={activeFrameType}
                    onFrameChange={handleFrameChange}
                  />
                )}

                {/* If only one frame type, still show the label */}
                {availableFrameTypes.length === 1 && (
                  <div className="flex gap-2">
                    <span className="px-4 py-2 text-xs tracking-[0.12em] uppercase border border-charcoal bg-charcoal text-warm-white rounded-sm">
                      {FRAME_TYPE_LABELS[availableFrameTypes[0]]}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Product info */}
              <div className="space-y-6">
                {product.category && (
                  <p className="text-xs text-muted tracking-[0.2em] uppercase">
                    {product.category.name}
                  </p>
                )}

                <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide leading-snug">
                  {product.name}
                </h1>

                {product.description && (
                  <p className="text-sm text-muted leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Size selector with human scale */}
                <SizeSelector
                  variants={activeVariants}
                  activeFrameType={activeFrameType}
                  activeSize={activeSize}
                  onSizeChange={setActiveSize}
                />

                {/* Add to cart (full width below) */}
                <WallArtAddToCart
                  productId={product.id}
                  productName={product.name}
                  productSlug={product.slug}
                  variants={activeVariants}
                  activeFrameType={activeFrameType}
                  activeSize={activeSize}
                  onTryOnWall={() => setShowAR(true)}
                />

                {/* Accordion */}
                <ProductDetailsAccordion product={product} />
              </div>
            </div>

            {/* ── Material close-up section ── */}
            {availableFrameTypes.length > 0 && (
              <MaterialCloseup
                availableFrameTypes={availableFrameTypes}
                activeFrameType={activeFrameType}
                onFrameChange={handleFrameChange}
              />
            )}

            {/* ── Related products ── */}
            {related.length > 0 && (
              <section className="border-t border-border pt-16">
                <h2 className="font-serif text-2xl text-charcoal tracking-wide mb-8">
                  You May Also Like
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-6">
                  {related.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* AR Modal */}
      {showAR && (
        <TryOnWallModal
          productName={product.name}
          activeImage={galleryImages[0]}
          onClose={() => setShowAR(false)}
        />
      )}
    </>
  );
}
