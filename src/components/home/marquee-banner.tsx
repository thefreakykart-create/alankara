"use client";

export default function MarqueeBanner() {
  const items = [
    "Handcrafted",
    "Heritage",
    "Home",
    "Artisan Made",
    "Contemporary",
    "Sustainable",
    "Indian Craft",
    "Timeless",
  ];

  return (
    <section className="py-8 bg-charcoal overflow-hidden">
      <div className="relative flex">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="flex items-center gap-8">
              <span className="font-serif text-2xl sm:text-3xl lg:text-4xl text-warm-white/80 tracking-[0.1em]">
                {item}
              </span>
              <span className="text-terracotta text-xl">&#9670;</span>
            </span>
          ))}
        </div>
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap" aria-hidden>
          {[...items, ...items].map((item, i) => (
            <span key={i} className="flex items-center gap-8">
              <span className="font-serif text-2xl sm:text-3xl lg:text-4xl text-warm-white/80 tracking-[0.1em]">
                {item}
              </span>
              <span className="text-terracotta text-xl">&#9670;</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
