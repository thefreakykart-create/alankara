"use client";

const ROW1 = ["Handcrafted", "Heritage", "Wall Art", "Artisan Made", "Contemporary", "Indian Craft"];
const ROW2 = ["Timeless", "Made in India", "Sustainable", "Canvas Print", "Acrylic", "Archival Ink"];

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items, ...items];
  return (
    <div className="flex overflow-hidden">
      <div className={`flex gap-0 shrink-0 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="font-serif text-3xl sm:text-4xl lg:text-5xl text-warm-white/70 tracking-[0.06em] px-6 whitespace-nowrap">
              {item}
            </span>
            <span className="text-terracotta text-base flex-none">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MarqueeBanner() {
  return (
    <section className="py-10 bg-charcoal overflow-hidden space-y-5 border-y border-warm-white/5">
      <MarqueeRow items={ROW1} />
      <MarqueeRow items={ROW2} reverse />
    </section>
  );
}
