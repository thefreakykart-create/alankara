"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

export default function FeaturedScroll({ products }: { products: FeaturedProduct[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip GSAP horizontal scroll on mobile — use native CSS scroll there
    if (window.innerWidth < 1024) return;

    const ctx = gsap.context(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const totalScrollWidth = scrollContainer.scrollWidth - window.innerWidth + 100;

      gsap.from(headingRef.current, {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: triggerRef.current, start: "top 80%" },
      });

      gsap.to(scrollContainer, {
        x: -totalScrollWidth,
        ease: "none",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: () => `+=${totalScrollWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (!products.length) return null;

  const header = (
    <div ref={headingRef} className="pt-16 lg:pt-24 pb-8 lg:pb-12 px-6 lg:px-16">
      <div className="flex items-end justify-between max-w-7xl mx-auto">
        <div>
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta">Curated for You</span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-6xl text-charcoal mt-2 tracking-[0.02em]">
            Featured Collection
          </h2>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-2 text-xs sm:text-sm tracking-[0.15em] uppercase text-charcoal hover:text-terracotta transition-colors group"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );

  return (
    <section ref={sectionRef} className="bg-warm-white overflow-hidden">

      {/* ── Mobile: native horizontal snap scroll ── */}
      <div className="lg:hidden">
        {header}
        <div className="flex gap-4 px-6 pb-10 overflow-x-auto snap-x snap-mandatory scrollbar-none"
          style={{ WebkitOverflowScrolling: "touch" }}>
          {products.map((product, i) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="flex-none w-[72vw] snap-start"
            >
              <div className="relative overflow-hidden aspect-[3/4] bg-cream rounded-sm">
                {product.images?.[0] && (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="72vw"
                    className="object-cover"
                  />
                )}
                <span className="absolute top-3 left-3 text-warm-white/50 font-serif text-4xl leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-serif text-lg text-charcoal leading-tight">{product.name}</h3>
                <p className="text-muted text-sm mt-1">{formatINR(product.price)}</p>
              </div>
            </Link>
          ))}
          {/* Trailing spacer so last card isn't flush with edge */}
          <div className="flex-none w-2" />
        </div>
      </div>

      {/* ── Desktop: GSAP horizontal pin scroll ── */}
      <div ref={triggerRef} className="relative hidden lg:block">
        {header}
        <div ref={scrollContainerRef} className="flex gap-8 pl-16 pb-24">
          {products.map((product, i) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group flex-shrink-0 w-[420px]"
            >
              <div className="relative overflow-hidden aspect-[3/4] bg-cream">
                {product.images?.[0] && (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="420px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/20 transition-colors duration-500" />
                <span className="absolute top-4 left-4 text-warm-white/60 font-serif text-6xl leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-5">
                <h3 className="font-serif text-xl text-charcoal group-hover:text-terracotta transition-colors duration-300">
                  {product.name}
                </h3>
                <p className="text-muted text-sm mt-1 tracking-wider">{formatINR(product.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </section>
  );
}
