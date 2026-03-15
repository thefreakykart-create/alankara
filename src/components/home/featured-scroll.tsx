"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const FEATURED_PRODUCTS = [
  {
    id: "1",
    name: "Terracotta Bloom Vase",
    price: "Rs.2,499",
    image:
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=800&auto=format&fit=crop",
    slug: "terracotta-bloom-vase",
  },
  {
    id: "2",
    name: "Brass Mandala Wall Art",
    price: "Rs.4,999",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop",
    slug: "brass-mandala-wall-art",
  },
  {
    id: "3",
    name: "Handwoven Jute Rug",
    price: "Rs.3,299",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop",
    slug: "handwoven-jute-rug",
  },
  {
    id: "4",
    name: "Copper Diya Set",
    price: "Rs.1,899",
    image:
      "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?q=80&w=800&auto=format&fit=crop",
    slug: "copper-diya-set",
  },
  {
    id: "5",
    name: "Silk Ikat Cushion",
    price: "Rs.1,499",
    image:
      "https://images.unsplash.com/photo-1584100936595-c0c6b4b3e0c5?q=80&w=800&auto=format&fit=crop",
    slug: "silk-ikat-cushion",
  },
  {
    id: "6",
    name: "Marble Tray Set",
    price: "Rs.3,799",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=800&auto=format&fit=crop",
    slug: "marble-tray-set",
  },
];

export default function FeaturedScroll() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const totalScrollWidth =
        scrollContainer.scrollWidth - window.innerWidth + 100;

      // Heading animation
      gsap.from(headingRef.current, {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top 80%",
        },
      });

      // Horizontal scroll
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

  return (
    <section ref={sectionRef} className="overflow-hidden bg-warm-white">
      <div ref={triggerRef} className="relative">
        {/* Section header */}
        <div ref={headingRef} className="pt-24 pb-12 px-6 lg:px-16">
          <div className="flex items-end justify-between max-w-7xl mx-auto">
            <div>
              <span className="text-xs tracking-[0.3em] uppercase text-terracotta">
                Curated for You
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-charcoal mt-3 tracking-[0.02em]">
                Featured Collection
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-charcoal hover:text-terracotta transition-colors group"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Horizontal scroll container */}
        <div ref={scrollContainerRef} className="flex gap-8 pl-6 lg:pl-16 pb-24">
          {FEATURED_PRODUCTS.map((product, i) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              data-cursor="View"
              className="group flex-shrink-0 w-[320px] sm:w-[380px] lg:w-[420px]"
            >
              <div className="relative overflow-hidden aspect-[3/4] bg-border">
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${product.image}')` }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/20 transition-colors duration-500" />

                {/* Number badge */}
                <span className="absolute top-4 left-4 text-warm-white/60 font-serif text-6xl leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-5">
                <h3 className="font-serif text-xl text-charcoal group-hover:text-terracotta transition-colors duration-300">
                  {product.name}
                </h3>
                <p className="text-muted text-sm mt-1 tracking-wider">
                  {product.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
