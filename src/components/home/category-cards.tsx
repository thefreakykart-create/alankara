"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CategoryData {
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
}

const FALLBACK: Record<string, string> = {
  "living-room": "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1200&auto=format&fit=crop",
  "bedroom": "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop",
  "kitchen-dining": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200&auto=format&fit=crop",
  "lighting": "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?q=80&w=1200&auto=format&fit=crop",
};

export default function CategoryCards({ categories }: { categories: CategoryData[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="bg-charcoal">
      <div className="flex items-center justify-between px-6 lg:px-12 pt-12 pb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-warm-white/30">Shop by Room</p>
        <Link href="/products" className="text-[10px] tracking-[0.25em] uppercase text-warm-white/30 hover:text-warm-white/70 transition-colors">
          All Rooms →
        </Link>
      </div>

      {/* Desktop: accordion panels */}
      <div className="hidden lg:flex h-[80vh]">
        {categories.map((cat, i) => {
          const img = cat.image_url || FALLBACK[cat.slug] || "";
          const isHovered = hovered === i;
          const anyHovered = hovered !== null;

          return (
            <motion.div
              key={cat.slug}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              animate={{ flex: isHovered ? 2.8 : anyHovered ? 0.65 : 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative overflow-hidden"
            >
              <Link href={`/products?category=${cat.slug}`} className="block h-full">
                {img && (
                  <Image
                    src={img}
                    alt={cat.name}
                    fill
                    sizes="25vw"
                    className={cn("object-cover transition-transform duration-700", isHovered ? "scale-105" : "scale-100")}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <span className="absolute top-6 left-5 font-mono text-5xl text-white/8 leading-none select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <motion.div animate={{ y: isHovered ? -6 : 0 }} transition={{ duration: 0.35 }}>
                    <h3 className="font-serif text-2xl lg:text-3xl text-white tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                      {cat.name}
                    </h3>
                    <motion.div
                      animate={{ height: isHovered ? "auto" : 0, opacity: isHovered ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {cat.description && (
                        <p className="text-white/55 text-sm mt-2 leading-relaxed">{cat.description}</p>
                      )}
                      <div className="flex items-center gap-2.5 mt-4">
                        <div className="h-px w-6 bg-terracotta" />
                        <span className="text-terracotta text-[10px] tracking-[0.25em] uppercase">Explore</span>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: 2×2 */}
      <div className="lg:hidden grid grid-cols-2">
        {categories.map((cat, i) => {
          const img = cat.image_url || FALLBACK[cat.slug] || "";
          return (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="relative aspect-square overflow-hidden group">
              {img && <Image src={img} alt={cat.name} fill sizes="50vw" className="object-cover transition-transform duration-500 group-active:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="text-[9px] text-white/30 font-mono mb-0.5">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-serif text-lg text-white">{cat.name}</h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
