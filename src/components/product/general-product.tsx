"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
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
import type { Product } from "@/lib/types/product";
import ProductCard from "@/components/product/product-card";

interface Props {
  product: Product;
  related: Product[];
}

export default function GeneralProduct({ product, related }: Props) {
  const images = product.images ?? [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartDrawerStore((s) => s.open);
  const { toast } = useToast();

  const clampedIndex = Math.min(activeImageIndex, Math.max(0, images.length - 1));
  const inStock = (product.stock_quantity ?? 0) > 0;
  const maxQty = Math.min(product.stock_quantity ?? 0, 10);
  const discount = product.compare_at_price
    ? getDiscountPercent(product.price, product.compare_at_price)
    : 0;

  const meta = product.metadata as Record<string, string> | null;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0] ?? null,
      quantity,
      slug: product.slug,
    });
    setAdded(true);
    toast(`${product.name} added to cart`);
    openCart();
    setTimeout(() => setAdded(false), 2500);
  };

  const accordionItems = [
    {
      id: "description",
      label: "About This Product",
      content: product.description || "A beautifully crafted piece for your home.",
    },
    ...(meta?.material || meta?.care ? [{
      id: "materials",
      label: "Materials & Care",
      content: [
        meta?.material && `Material: ${meta.material}`,
        meta?.care && `Care: ${meta.care}`,
      ].filter(Boolean).join("\n"),
    }] : []),
    {
      id: "shipping",
      label: "Shipping & Returns",
      content: "Free shipping on orders above ₹999. Standard delivery in 5–7 business days. Easy 7-day returns on undamaged items.",
    },
  ];

  return (
    <>
      <div className="flex flex-col lg:flex-row pt-28">

        {/* ── LEFT: sticky image panel ── */}
        <div className="relative aspect-[4/5] lg:aspect-auto lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)] lg:w-[58%] lg:self-start flex-none bg-[#F2EDE6] overflow-hidden">

          <Link
            href="/products"
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-xs text-charcoal/70 hover:text-charcoal transition-colors bg-warm-white/75 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>

          {product.category && (
            <div className="absolute top-4 right-4 z-20">
              <span className="text-[10px] tracking-[0.18em] uppercase text-charcoal/60 bg-warm-white/75 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                {(product.category as { name?: string }).name}
              </span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={clampedIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              {images[clampedIndex] ? (
                <Image
                  src={images[clampedIndex]}
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

          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {images.map((img, i) => (
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

        {/* ── RIGHT: content panel ── */}
        <div className="lg:w-[42%] flex-none bg-warm-white">
          <div className="px-6 sm:px-8 lg:px-12 pt-6 lg:pt-8 pb-20 space-y-8 max-w-lg mx-auto lg:max-w-none">

            {/* Name + short description + price */}
            <div className="space-y-3">
              <h1 className="font-serif text-3xl lg:text-4xl text-charcoal leading-tight tracking-wide">
                {product.name}
              </h1>
              {meta?.short_description && (
                <p className="text-sm text-muted leading-relaxed">{meta.short_description}</p>
              )}
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-semibold text-charcoal tabular-nums">
                  {formatINR(product.price)}
                </span>
                {product.compare_at_price && (
                  <>
                    <span className="text-base text-muted line-through tabular-nums">
                      {formatINR(product.compare_at_price)}
                    </span>
                    <span className="text-xs font-bold text-terracotta tracking-widest uppercase">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-muted/70">Incl. of all taxes · Free shipping above ₹999</p>
            </div>

            <div className="h-px bg-charcoal/10" />

            {/* Low stock */}
            {inStock && (product.stock_quantity ?? 0) <= 5 && (
              <p className="text-xs font-semibold text-terracotta">
                Only {product.stock_quantity} left — order soon
              </p>
            )}

            {/* Quantity + CTA */}
            <div className="space-y-3">
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
                disabled={!inStock || added}
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
                        <p className="pb-5 text-sm text-muted leading-relaxed whitespace-pre-line">{item.content}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── Why Alankara strip ── */}
      <div className="bg-charcoal text-warm-white px-6 sm:px-10 lg:px-20 py-14 lg:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 lg:mb-12">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/30 mb-2">Why Alankara</p>
            <h2 className="font-serif text-2xl lg:text-3xl leading-snug">
              Crafted for lasting beauty.
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {[
              { title: "Handcrafted", desc: "Every piece made with care by skilled Indian artisans." },
              { title: "Quality First", desc: "Only premium materials that stand the test of time." },
              { title: "Thoughtful Design", desc: "Products designed to complement any interior style." },
              { title: "Made in India", desc: "Proudly supporting local craftsmanship and heritage." },
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
                href={`/products?category=${(product.category as { slug?: string })?.slug ?? ""}`}
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
    </>
  );
}
