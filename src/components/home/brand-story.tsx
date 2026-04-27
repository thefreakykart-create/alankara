"use client";

import Link from "next/link";

const STATS = [
  { value: "500+", label: "Designs" },
  { value: "25+", label: "Artisan Families" },
  { value: "10k+", label: "Happy Homes" },
  { value: "3", label: "Frame Materials" },
];

export default function BrandStory() {
  return (
    <section id="story" className="bg-cream">

      {/* Manifesto */}
      <div className="px-6 sm:px-10 lg:px-20 pt-20 lg:pt-28 pb-16 lg:pb-20 max-w-6xl mx-auto">
        <p className="text-[10px] tracking-[0.3em] uppercase text-terracotta mb-6">Our Belief</p>
        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-charcoal leading-[1.08] tracking-tight">
          Your walls deserve<br />
          <em className="not-italic text-terracotta">art that means something.</em>
        </h2>
        <p className="mt-8 text-base lg:text-lg text-muted leading-relaxed max-w-2xl">
          Alankara bridges India&apos;s centuries-old craft traditions with contemporary living.
          Every print is made with archival inks, every frame sourced responsibly — art you can
          pass down, not throw away.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-3 mt-10 text-sm tracking-[0.15em] uppercase text-charcoal group"
        >
          <span className="w-8 h-px bg-charcoal group-hover:w-12 transition-all duration-300" />
          Browse Collection
        </Link>
      </div>

      {/* Stats strip */}
      <div className="border-t border-charcoal/8 grid grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={[
              "px-6 sm:px-8 lg:px-12 py-8 lg:py-12",
              // right border: on mobile cols 0 only (not col 1), on desktop cols 0-2
              i % 2 === 0 ? "border-r border-charcoal/8" : "",
              // top border: bottom row on mobile (i >= 2), never on desktop
              i >= 2 ? "border-t border-charcoal/8 lg:border-t-0" : "",
            ].join(" ")}
          >
            <p className="font-serif text-4xl lg:text-5xl text-charcoal tracking-tight">{s.value}</p>
            <p className="text-xs tracking-[0.2em] uppercase text-muted mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Process strip */}
      <div className="border-t border-charcoal/8 grid grid-cols-1 sm:grid-cols-3">
        {[
          { step: "01", title: "Choose Your Art", desc: "Browse 500+ original designs across devotional, nature, abstract and more." },
          { step: "02", title: "Pick Your Frame", desc: "Canvas, acrylic or wooden — each material transforms the mood of the piece." },
          { step: "03", title: "We Print & Ship", desc: "Archival-grade printing, hand-inspected, delivered to your door in 5–7 days." },
        ].map((p, i) => (
          <div
            key={p.step}
            className={`px-8 lg:px-12 py-10 ${i < 2 ? "sm:border-r border-charcoal/8" : ""} ${i > 0 ? "border-t sm:border-t-0 border-charcoal/8" : ""}`}
          >
            <span className="text-[10px] font-mono text-terracotta tracking-[0.2em]">{p.step}</span>
            <h3 className="font-serif text-xl text-charcoal mt-2 mb-2">{p.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
