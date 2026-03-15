"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Split heading text into characters for reveal
      const heading = headingRef.current;
      if (!heading) return;

      const text = heading.textContent || "";
      heading.innerHTML = "";
      const chars: HTMLSpanElement[] = [];

      text.split("").forEach((char) => {
        const span = document.createElement("span");
        span.textContent = char === " " ? "\u00A0" : char;
        span.style.display = "inline-block";
        span.style.opacity = "0";
        span.style.transform = "translateY(100%)";
        heading.appendChild(span);
        chars.push(span);
      });

      // Entry animation timeline
      const tl = gsap.timeline({ delay: 0.3 });

      // Fade in the background image
      tl.to(imageRef.current, {
        scale: 1,
        opacity: 1,
        duration: 1.8,
        ease: "power3.out",
      });

      // Reveal characters one by one
      tl.to(
        chars,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.03,
          ease: "power3.out",
        },
        "-=1"
      );

      // Fade in subtitle
      tl.to(
        subRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.4"
      );

      // Fade in CTA
      tl.to(
        ctaRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.5"
      );

      // Parallax on scroll
      gsap.to(imageRef.current, {
        y: 150,
        scale: 1.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // Fade out content on scroll
      gsap.to(overlayRef.current, {
        opacity: 0.8,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "30% top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with parallax */}
      <div
        ref={imageRef}
        className="absolute inset-0 scale-110 opacity-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2832&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Dark overlay */}
      <div ref={overlayRef} className="absolute inset-0 bg-dark/40" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h2
          ref={headingRef}
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-warm-white tracking-[0.05em] leading-[1.1] text-reveal-clip"
        >
          Where Heritage Meets Home
        </h2>

        <p
          ref={subRef}
          className="mt-6 text-warm-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed opacity-0 translate-y-6"
        >
          Discover handcrafted Indian decor that tells a story. Each piece
          bridges centuries of artisan tradition with contemporary design.
        </p>

        <div
          ref={ctaRef}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center opacity-0 translate-y-6"
        >
          <Link
            href="/products"
            data-cursor="Shop"
            className="group relative inline-flex items-center justify-center px-10 py-4 bg-terracotta text-warm-white text-sm tracking-[0.2em] uppercase overflow-hidden transition-colors duration-500 hover:bg-terracotta-light"
          >
            <span className="relative z-10">Explore Collection</span>
          </Link>
          <Link
            href="#story"
            className="inline-flex items-center justify-center px-10 py-4 border border-warm-white/40 text-warm-white text-sm tracking-[0.2em] uppercase hover:bg-warm-white/10 transition-colors duration-500"
          >
            Our Story
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-warm-white/50 text-[10px] tracking-[0.3em] uppercase">
          Scroll
        </span>
        <div className="w-[1px] h-12 bg-warm-white/30 relative overflow-hidden">
          <div className="w-full h-1/2 bg-warm-white animate-bounce" />
        </div>
      </div>
    </section>
  );
}
