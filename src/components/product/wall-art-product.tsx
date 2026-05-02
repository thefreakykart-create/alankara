"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  ShoppingBag,
  Check,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { useToast } from "@/components/ui/toast";
import { formatINR, getDiscountPercent, cn } from "@/lib/utils";
import type { Product, ProductVariant, FrameType, FrameSize, GroupProduct } from "@/lib/types/product";
import {
  FRAME_TYPE_LABELS,
  FRAME_SIZE_LABELS,
  FRAME_SIZE_CM,
  FRAME_TYPE_DESCRIPTIONS,
} from "@/lib/types/product";
import ProductCard from "@/components/product/product-card";
import TryOnWallModal from "@/components/product/try-on-wall-modal";
import WishlistButton from "@/components/product/wishlist-button";
import ShareButton from "@/components/product/share-button";
import PincodeEstimator from "@/components/product/pincode-estimator";
import StickyAddToCart from "@/components/product/sticky-add-to-cart";
import ImageZoomModal, { ZoomHint } from "@/components/product/image-zoom-modal";

interface WallArtProductProps {
  product: Product;
  variants: ProductVariant[];
  related: Product[];
  groupProducts?: GroupProduct[];
}

const FRAME_MATERIALS: Record<FrameType, { texture: string }> = {
  canvas:  { texture: "bg-[#f0e8db]" },
  acrylic: { texture: "bg-[#dceaf5]" },
  wooden:  { texture: "bg-[#e4ddd3]" },
};

const ALL_SIZES: FrameSize[] = ["8x12", "12x18", "18x24", "24x36"];

export default function WallArtProduct({ product, variants, related, groupProducts = [] }: WallArtProductProps) {
  const router = useRouter();
  const activeVariants = variants.filter((v) => v.is_active);

  // Determine current frame type from product.frame_type or first variant
  const currentFrameType = (product.frame_type ?? activeVariants[0]?.frame_type ?? "canvas") as FrameType;
  const defaultSize = (activeVariants[0]?.size ?? null) as FrameSize | null;

  const [activeSize, setActiveSize] = useState<FrameSize | null>(defaultSize);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartDrawerStore((s) => s.open);
  const { toast } = useToast();

  // Frame type tabs: use group products if available, else derive from variants (legacy)
  const hasGroup = groupProducts.length > 1;
  const availableFrameTypes: FrameType[] = hasGroup
    ? groupProducts.map((p) => p.frame_type)
    : (Array.from(new Set(activeVariants.map((v) => v.frame_type))) as FrameType[]);

  const handleFrameChange = useCallback((ft: FrameType) => {
    if (hasGroup) {
      const target = groupProducts.find((p) => p.frame_type === ft);
      if (target && target.slug !== product.slug) {
        router.push(`/products/${target.slug}`);
      }
      return;
    }
    // Legacy: same product multi-frame-type
    setActiveImageIndex(0);
    const firstSize = (activeVariants.find((v) => v.frame_type === ft)?.size ?? null) as FrameSize | null;
    setActiveSize(firstSize);
  }, [hasGroup, groupProducts, product.slug, activeVariants, router]);

  const galleryImages = (() => {
    const imgs = activeVariants
      .flatMap((v) => v.images)
      .filter(Boolean);
    // De-dupe
    return [...new Map(imgs.map((u) => [u, u])).values()];
  })();
  const fallbackImages = galleryImages.length > 0 ? galleryImages : (product.images ?? []);

  const clampedIndex = Math.min(activeImageIndex, Math.max(0, fallbackImages.length - 1));

  const activeVariant = activeVariants.find((v) => v.size === activeSize) ?? null;

  const inStock = activeVariant ? activeVariant.stock_quantity > 0 : false;
  const maxQty = activeVariant ? Math.min(activeVariant.stock_quantity, 10) : 0;
  const discount = activeVariant?.compare_at_price
    ? getDiscountPercent(activeVariant.price, activeVariant.compare_at_price)
    : 0;

  const handleAdd = () => {
    if (!activeVariant || !activeSize) return;
    addItem({
      productId: product.id,
      variantId: activeVariant.id,
      name: `${product.name}`,
      price: activeVariant.price,
      image: fallbackImages[0] ?? "",
      quantity,
      slug: product.slug,
      frameType: FRAME_TYPE_LABELS[currentFrameType],
      frameSize: FRAME_SIZE_LABELS[activeSize],
    });
    setAdded(true);
    toast(`${product.name} added to cart`);
    openCart();
    setTimeout(() => setAdded(false), 2500);
  };

  const accordionItems = [
    {
      id: "description",
      label: "About This Piece",
      content: product.description ?? "A beautifully crafted piece for your space.",
    },
    {
      id: "materials",
      label: "Materials & Craftsmanship",
      content: `${FRAME_TYPE_DESCRIPTIONS[currentFrameType]} Printed with archival-grade, fade-resistant inks for lasting vibrancy. Each piece is hand-inspected before dispatch.`,
    },
    {
      id: "shipping",
      label: "Shipping & Returns",
      content: "Free shipping on orders above ₹999. Standard delivery in 5–7 business days. Easy 7-day returns on undamaged items.",
    },
  ];

  const meta = product.metadata as Record<string, string> | null;
  const tags = meta?.tags ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const savings = activeVariant?.compare_at_price
    ? activeVariant.compare_at_price - activeVariant.price : 0;

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-28 px-6 lg:px-10 bg-warm-white">
        <nav className="flex items-center gap-2 text-xs text-muted tracking-wide py-3">
          <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-charcoal transition-colors">Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/products?category=${(product.category as { slug?: string }).slug ?? ""}`}
                className="hover:text-charcoal transition-colors"
              >
                {(product.category as { name?: string }).name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-charcoal truncate max-w-[160px]">{product.name}</span>
        </nav>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-col lg:flex-row">

        {/* ── LEFT: sticky image panel ── */}
        <div className="relative aspect-[4/5] lg:aspect-auto lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)] lg:w-[58%] lg:self-start flex-none bg-[#F2EDE6] overflow-hidden">

          {/* Floating back link */}
          <Link
            href="/products"
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-xs text-charcoal/70 hover:text-charcoal transition-colors bg-warm-white/75 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>

          {/* Category badge */}
          {product.category && (
            <div className="absolute top-4 right-4 z-20">
              <span className="text-[10px] tracking-[0.18em] uppercase text-charcoal/60 bg-warm-white/75 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                {product.category.name}
              </span>
            </div>
          )}

          {/* Main image with crossfade — click to zoom */}
          <div
            className="absolute inset-0 cursor-zoom-in group"
            onClick={() => fallbackImages[clampedIndex] && setZoomSrc(fallbackImages[clampedIndex])}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={clampedIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                {fallbackImages[clampedIndex] ? (
                  <Image
                    src={fallbackImages[clampedIndex]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-charcoal/20 text-sm tracking-widest uppercase">No image</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              </motion.div>
            </AnimatePresence>
            <ZoomHint />
          </div>

          {/* Frame label — bottom left */}
          <div className="absolute bottom-4 left-5 z-20">
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/80 font-medium">
              {FRAME_TYPE_LABELS[currentFrameType]} Print
            </span>
          </div>

          {/* Thumbnail strip — bottom center */}
          {fallbackImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {fallbackImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "relative w-10 h-14 lg:w-12 lg:h-16 rounded overflow-hidden border-2 transition-all flex-none",
                    i === clampedIndex
                      ? "border-white opacity-100 shadow-md"
                      : "border-transparent opacity-50 hover:opacity-80"
                  )}
                >
                  <Image src={img} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: normal flow — page scroll moves this, left panel stays pinned ── */}
        <div className="lg:w-[42%] flex-none bg-warm-white">
          <div className="px-6 sm:px-8 lg:px-12 pt-6 lg:pt-8 pb-20 space-y-8 max-w-lg mx-auto lg:max-w-none">

            {/* Name + price */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-serif text-3xl lg:text-4xl text-charcoal leading-tight tracking-wide">
                  {product.name}
                </h1>
                <WishlistButton productId={product.id} className="mt-1 flex-none" />
              </div>
              {meta?.short_description && (
                <p className="text-sm text-muted leading-relaxed">{meta.short_description}</p>
              )}

              {activeVariant ? (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-2xl font-semibold text-charcoal tabular-nums">
                      {formatINR(activeVariant.price)}
                    </span>
                    {activeVariant.compare_at_price && (
                      <>
                        <span className="text-base text-muted line-through tabular-nums">
                          {formatINR(activeVariant.compare_at_price)}
                        </span>
                        <span className="text-xs font-bold text-terracotta tracking-widest uppercase">
                          {discount}% off
                        </span>
                      </>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-xs font-medium text-emerald-700 bg-emerald-50 inline-flex px-2.5 py-1 rounded-full">
                      You save {formatINR(savings)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">Select options to see pricing</p>
              )}
              <p className="text-[11px] text-muted/70">Incl. of all taxes · Free shipping above ₹999</p>
              {activeVariant?.sku && (
                <p className="text-[11px] text-muted/60">SKU: {activeVariant.sku}</p>
              )}
            </div>

            <div className="h-px bg-charcoal/10" />

            {/* Material selector */}
            {availableFrameTypes.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted">
                  Material
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {availableFrameTypes.map((ft) => (
                    <button
                      key={ft}
                      onClick={() => handleFrameChange(ft)}
                      className={cn(
                        "flex flex-col items-start gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left",
                        currentFrameType === ft
                          ? "border-charcoal bg-charcoal"
                          : "border-border bg-white hover:border-charcoal/30"
                      )}
                    >
                      <div className={cn(
                        "w-full h-5 rounded-md",
                        currentFrameType === ft
                          ? "bg-white/20"
                          : FRAME_MATERIALS[ft].texture
                      )} />
                      <span className={cn(
                        "text-[11px] font-semibold tracking-wide leading-none",
                        currentFrameType === ft ? "text-white" : "text-charcoal"
                      )}>
                        {FRAME_TYPE_LABELS[ft]}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted/80 leading-relaxed">
                  {FRAME_TYPE_DESCRIPTIONS[currentFrameType]}
                </p>
              </div>
            )}

            {/* Size selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted">Size</p>
                {activeSize && (
                  <span className="text-[11px] text-muted">
                    {FRAME_SIZE_CM[activeSize].w} × {FRAME_SIZE_CM[activeSize].h} cm
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ALL_SIZES.map((size) => {
                  const variant = activeVariants.find((v) => v.size === size);
                  const available = !!variant;
                  const dim = FRAME_SIZE_CM[size];
                  const isSelected = activeSize === size;

                  return (
                    <button
                      key={size}
                      onClick={() => available && setActiveSize(size)}
                      disabled={!available}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left",
                        isSelected
                          ? "border-charcoal bg-charcoal"
                          : available
                          ? "border-border bg-white hover:border-charcoal/30"
                          : "border-border/30 bg-zinc-50 opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div>
                        <p className={cn(
                          "text-sm font-semibold",
                          isSelected ? "text-white" : "text-charcoal"
                        )}>
                          {FRAME_SIZE_LABELS[size]}
                        </p>
                        <p className={cn(
                          "text-[10px] mt-0.5",
                          isSelected ? "text-white/60" : "text-muted"
                        )}>
                          {dim.w}×{dim.h} cm
                        </p>
                      </div>
                      {variant?.price && (
                        <span className={cn(
                          "text-xs font-medium tabular-nums",
                          isSelected ? "text-white/80" : "text-charcoal/70"
                        )}>
                          {formatINR(variant.price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Human scale visualiser */}
            {activeSize && (
              <div className="flex items-center gap-5 px-4 py-4 bg-cream rounded-xl">
                <div className="flex items-end gap-3 flex-none">
                  {/* Person silhouette */}
                  <svg width="20" height="72" viewBox="0 0 20 72" fill="none" className="opacity-30 flex-none">
                    <circle cx="10" cy="8" r="6" fill="#1A1A1A" />
                    <path d="M5 18 Q10 16 15 18 L16 52 Q10 58 4 52 Z" fill="#1A1A1A" />
                    <line x1="7" y1="52" x2="5" y2="72" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
                    <line x1="13" y1="52" x2="15" y2="72" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {/* Frame silhouette */}
                  <div
                    className="border-2 border-charcoal/20 bg-terracotta/10 rounded-sm flex-none"
                    style={{
                      width:  `${Math.round((FRAME_SIZE_CM[activeSize].w / 170) * 72)}px`,
                      height: `${Math.round((FRAME_SIZE_CM[activeSize].h / 170) * 72)}px`,
                    }}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-charcoal">
                    {FRAME_SIZE_LABELS[activeSize]}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">
                    {FRAME_SIZE_CM[activeSize].w} × {FRAME_SIZE_CM[activeSize].h} cm
                  </p>
                  <p className="text-[10px] text-muted/60 mt-1">Scale vs 5′7″ person</p>
                </div>
              </div>
            )}

            {/* Low stock warning */}
            {activeVariant && activeVariant.stock_quantity > 0 && activeVariant.stock_quantity <= 5 && (
              <p className="text-xs font-semibold text-terracotta">
                Only {activeVariant.stock_quantity} left — order soon
              </p>
            )}

            {/* Quantity + CTA */}
            <div className="space-y-3">
              {!activeSize ? (
                <p className="text-sm text-muted text-center py-4 border border-dashed border-border rounded-xl">
                  Select a size to continue
                </p>
              ) : (
                <>
                  {inStock && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">Qty</span>
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          className="w-9 h-9 flex items-center justify-center hover:bg-cream transition-colors disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium border-x border-border h-9 flex items-center justify-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                          disabled={quantity >= maxQty}
                          className="w-9 h-9 flex items-center justify-center hover:bg-cream transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <motion.button
                    onClick={handleAdd}
                    disabled={!inStock || added || !activeVariant}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full h-14 flex items-center justify-center gap-2.5 text-sm font-bold tracking-[0.1em] uppercase rounded-xl transition-all duration-300",
                      added
                        ? "bg-emerald-700 text-white"
                        : inStock
                        ? "bg-charcoal text-warm-white hover:bg-terracotta"
                        : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                    )}
                  >
                    {added ? (
                      <><Check className="w-4 h-4" /> Added to Cart</>
                    ) : inStock ? (
                      <><ShoppingBag className="w-4 h-4" /> Add to Cart</>
                    ) : (
                      "Out of Stock"
                    )}
                  </motion.button>

                  <button
                    onClick={() => setShowAR(true)}
                    className="w-full h-12 flex items-center justify-center gap-2 text-xs tracking-[0.12em] uppercase text-charcoal border border-charcoal/20 rounded-xl hover:border-charcoal hover:bg-cream/50 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Try on my wall
                  </button>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Truck, label: "Free Shipping", sub: "Above ₹999" },
                { icon: RotateCcw, label: "7-Day Returns", sub: "Hassle free" },
                { icon: Shield, label: "Secure Pay", sub: "100% safe" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-cream text-center">
                  <Icon className="w-4 h-4 text-charcoal/40" />
                  <p className="text-[10px] font-semibold text-charcoal leading-tight">{label}</p>
                  <p className="text-[9px] text-muted">{sub}</p>
                </div>
              ))}
            </div>

            {/* Share */}
            <ShareButton title={product.name} />

            <div className="h-px bg-charcoal/8" />

            {/* Pincode */}
            <PincodeEstimator />

            <div className="h-px bg-charcoal/8" />

            {/* Accordion */}
            <div className="border-t border-border">
              {accordionItems.map((item) => (
                <div key={item.id} className="border-b border-border">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                    className="w-full flex items-center justify-between py-4 text-left gap-4"
                  >
                    <span className="text-sm font-medium text-charcoal">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted flex-none transition-transform duration-200",
                        openAccordion === item.id && "rotate-180"
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {openAccordion === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-sm text-muted leading-relaxed">{item.content}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-cream text-muted border border-border hover:border-charcoal/30 transition-colors cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Sticky cart (mobile) */}
      <StickyAddToCart
        product={product}
        overridePrice={activeVariant?.price}
        onAdd={handleAdd}
        disabled={!inStock || !activeSize}
      />

      {/* Image zoom modal */}
      {zoomSrc && (
        <ImageZoomModal src={zoomSrc} alt={product.name} onClose={() => setZoomSrc(null)} />
      )}

      {/* ── Why Alankara strip ── */}
      <div className="bg-charcoal text-warm-white px-6 sm:px-10 lg:px-20 py-14 lg:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 lg:mb-12">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2">Why Alankara</p>
            <h2 className="font-serif text-2xl lg:text-3xl leading-snug">
              Art made to last a lifetime.
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {[
              { title: "Archival Inks", desc: "UV-resistant, fade-proof printing that stays vibrant for decades." },
              { title: "Hand-Inspected", desc: "Every piece is checked for quality before it ships." },
              { title: "Sustainably Sourced", desc: "FSC-certified wood and eco-friendly canvas materials." },
              { title: "Made in India", desc: "Crafted with pride by local artisans in our Jaipur studio." },
            ].map((f) => (
              <div key={f.title}>
                <p className="text-sm font-semibold text-white mb-2">{f.title}</p>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Related products ── */}
      {related.length > 0 && (
        <div className="bg-warm-white px-6 sm:px-10 lg:px-20 py-14 lg:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide">
                Complete the Look
              </h2>
              <Link
                href={`/products?category=${product.category?.slug ?? ""}`}
                className="text-xs tracking-[0.15em] uppercase text-muted hover:text-charcoal transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}

      {showAR && (
        <TryOnWallModal
          productName={product.name}
          activeImage={galleryImages[0]}
          activeSize={activeSize}
          onClose={() => setShowAR(false)}
        />
      )}
    </>
  );
}
