"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const CATEGORIES = [
  {
    name: "Living Room",
    slug: "living-room",
    image:
      "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=800&auto=format&fit=crop",
    description: "Sofas, tables, rugs & wall art",
  },
  {
    name: "Bedroom",
    slug: "bedroom",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800&auto=format&fit=crop",
    description: "Bedding, lamps & accents",
  },
  {
    name: "Kitchen",
    slug: "kitchen",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop",
    description: "Serveware, storage & textiles",
  },
  {
    name: "Lighting",
    slug: "lighting",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?q=80&w=800&auto=format&fit=crop",
    description: "Pendant lamps, diyas & candles",
  },
];

export default function CategoryCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading reveal
      gsap.from(headingRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      // Cards staggered parallax
      cardsRef.current.forEach((card, i) => {
        if (!card) return;

        // Parallax offset — alternate cards have different speeds
        const yOffset = i % 2 === 0 ? -60 : -30;

        gsap.from(card, {
          opacity: 0,
          y: 80,
          duration: 0.8,
          delay: i * 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
        });

        gsap.to(card, {
          y: yOffset,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Mouse tilt handler
  const handleMouseMove = (
    e: React.MouseEvent<HTMLAnchorElement>,
    index: number
  ) => {
    const card = cardsRef.current[index];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    gsap.to(card, {
      rotateX,
      rotateY,
      duration: 0.3,
      ease: "power2.out",
      transformPerspective: 1000,
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={headingRef} className="text-center mb-16">
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta">
            Explore
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-charcoal mt-3 tracking-[0.02em]">
            Shop by Room
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {CATEGORIES.map((category, i) => (
            <Link
              key={category.slug}
              ref={(el) => { cardsRef.current[i] = el; }}
              href={`/products?category=${category.slug}`}
              data-cursor="Explore"
              className="group relative overflow-hidden aspect-[3/4] will-change-transform"
              style={{ transformStyle: "preserve-3d" }}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => handleMouseLeave(i)}
            >
              {/* Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${category.image}')` }}
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-serif text-2xl text-warm-white tracking-wider">
                  {category.name}
                </h3>
                <p className="text-warm-white/60 text-sm mt-1">
                  {category.description}
                </p>

                {/* Animated underline */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-[1px] w-8 bg-terracotta-light group-hover:w-16 transition-all duration-500" />
                  <span className="text-terracotta-light text-xs tracking-[0.2em] uppercase">
                    Shop Now
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
