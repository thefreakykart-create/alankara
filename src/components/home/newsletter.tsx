"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Newsletter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2832&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-dark/70" />

      <div
        ref={contentRef}
        className="relative z-10 max-w-2xl mx-auto text-center px-6"
      >
        <span className="text-xs tracking-[0.3em] uppercase text-terracotta-light">
          Stay Connected
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-warm-white mt-3 tracking-[0.02em]">
          Join the Alankara Family
        </h2>
        <p className="mt-4 text-warm-white/60 text-base">
          Be the first to know about new collections, artisan stories, and
          exclusive offers.
        </p>

        <form
          className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="Your email address"
            className="flex-1 px-6 py-4 bg-warm-white/10 border border-warm-white/20 text-warm-white placeholder:text-warm-white/40 text-sm tracking-wider outline-none focus:border-terracotta-light transition-colors"
          />
          <button
            type="submit"
            className="px-8 py-4 bg-terracotta text-warm-white text-sm tracking-[0.2em] uppercase hover:bg-terracotta-light transition-colors duration-300"
          >
            Subscribe
          </button>
        </form>

        <p className="mt-4 text-warm-white/30 text-xs">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
