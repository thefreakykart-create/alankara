"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    location: "Mumbai",
    rating: 5,
    text: "The brass mandala wall art is absolutely stunning. The craftsmanship is exquisite and it's become the centerpiece of my living room.",
    product: "Brass Mandala Wall Art",
  },
  {
    name: "Arjun Mehta",
    location: "Bangalore",
    rating: 5,
    text: "Ordered the jute rug and copper diyas — both arrived beautifully packaged. The quality far exceeded my expectations for the price.",
    product: "Handwoven Jute Rug",
  },
  {
    name: "Kavita Reddy",
    location: "Hyderabad",
    rating: 5,
    text: "Finally found decor that feels authentically Indian without being dated. Alankara perfectly captures that modern-meets-heritage aesthetic.",
    product: "Silk Ikat Cushion Set",
  },
  {
    name: "Rohit Patel",
    location: "Delhi",
    rating: 5,
    text: "Gifted the marble tray set to my parents for their anniversary. They were thrilled. The attention to detail in every piece is remarkable.",
    product: "Marble Tray Set",
  },
  {
    name: "Anjali Nair",
    location: "Kochi",
    rating: 5,
    text: "The terracotta vases have such a warm, earthy quality. They bring life to any corner. Already planning my next order!",
    product: "Terracotta Bloom Vase",
  },
  {
    name: "Vikram Singh",
    location: "Jaipur",
    rating: 5,
    text: "As someone from Rajasthan, I appreciate genuine craft. Alankara works directly with artisans and you can feel it in every piece.",
    product: "Handcrafted Cushion Set",
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading
      gsap.from(headingRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 80%",
        },
      });

      // Staggered card reveal
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          opacity: 0,
          y: 60,
          duration: 0.7,
          delay: i * 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={headingRef} className="text-center mb-16">
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta">
            Loved by Homes
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-charcoal mt-3 tracking-[0.02em]">
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((testimonial, i) => (
            <div
              key={i}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="bg-warm-white p-8 border border-border hover:border-terracotta/30 transition-colors duration-500"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 fill-gold text-gold"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-charcoal/80 text-sm leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Product tag */}
              <p className="mt-4 text-xs text-terracotta tracking-wider">
                Purchased: {testimonial.product}
              </p>

              {/* Author */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="font-medium text-charcoal text-sm">
                  {testimonial.name}
                </p>
                <p className="text-muted text-xs">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
