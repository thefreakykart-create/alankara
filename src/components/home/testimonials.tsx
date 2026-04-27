"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote: "The brass mandala wall art is absolutely stunning. The craftsmanship is exquisite — it's become the centrepiece of our living room.",
    name: "Priya Sharma",
    city: "Mumbai",
  },
  {
    quote: "Finally found décor that feels authentically Indian without being dated. Alankara perfectly captures that modern-meets-heritage aesthetic.",
    name: "Kavita Reddy",
    city: "Hyderabad",
  },
  {
    quote: "The acrylic print arrived perfectly packaged. The colours are so vivid — far richer than I expected from the website photos.",
    name: "Arjun Mehta",
    city: "Bangalore",
  },
  {
    quote: "As someone from Rajasthan, I appreciate genuine craft. You can feel the care in every piece Alankara makes.",
    name: "Vikram Singh",
    city: "Jaipur",
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const t = TESTIMONIALS[active];

  return (
    <section className="bg-charcoal px-6 sm:px-10 lg:px-20 py-20 lg:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto">

        {/* Decorative quote mark */}
        <p className="font-serif text-8xl lg:text-9xl text-warm-white/6 leading-none select-none mb-2">
          "
        </p>

        {/* Rotating quote */}
        <div className="min-h-[180px] lg:min-h-[140px] flex items-start">
          <AnimatePresence mode="wait">
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-serif text-2xl sm:text-3xl lg:text-4xl text-warm-white/85 leading-snug tracking-wide"
            >
              {t.quote}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Author */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active + "-author"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-4 mt-8"
          >
            <div className="h-px w-8 bg-terracotta flex-none" />
            <div>
              <p className="text-sm font-semibold text-warm-white/80">{t.name}</p>
              <p className="text-xs text-warm-white/35 tracking-wide">{t.city}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot navigation */}
        <div className="flex gap-2.5 mt-10">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "h-px transition-all duration-400",
                i === active ? "w-8 bg-terracotta" : "w-4 bg-warm-white/20 hover:bg-warm-white/40"
              )}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
