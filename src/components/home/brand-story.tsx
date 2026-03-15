"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STORY_SECTIONS = [
  {
    title: "Rooted in Tradition",
    description:
      "Every piece in our collection is born from centuries-old Indian craft techniques passed down through generations of artisan families.",
    image:
      "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "Designed for Today",
    description:
      "We reimagine traditional forms with contemporary sensibilities, creating decor that feels both timeless and refreshingly modern.",
    image:
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "Made with Purpose",
    description:
      "Each purchase directly supports artisan communities across India, preserving craft traditions while building sustainable livelihoods.",
    image:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop",
  },
];

export default function BrandStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
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

      // Animate each story block
      const blocks = sectionRef.current?.querySelectorAll(".story-block");
      blocks?.forEach((block, i) => {
        const image = block.querySelector(".story-image");
        const text = block.querySelector(".story-text");

        gsap.from(image, {
          opacity: 0,
          x: i % 2 === 0 ? -80 : 80,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: block,
            start: "top 70%",
          },
        });

        gsap.from(text, {
          opacity: 0,
          x: i % 2 === 0 ? 80 : -80,
          duration: 1,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: block,
            start: "top 70%",
          },
        });

        // Parallax on images
        gsap.to(image, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: block,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="story" ref={sectionRef} className="py-24 lg:py-32 bg-warm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={headingRef} className="text-center mb-20">
          <span className="text-xs tracking-[0.3em] uppercase text-terracotta">
            Our Story
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-charcoal mt-3 tracking-[0.02em]">
            Craft Meets Contemporary
          </h2>
          <p className="mt-4 text-muted text-lg max-w-2xl mx-auto">
            Alankara is a bridge between India&apos;s rich artisan heritage and the
            modern home.
          </p>
        </div>

        <div className="space-y-24 lg:space-y-32">
          {STORY_SECTIONS.map((section, i) => (
            <div
              key={i}
              className={`story-block grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                i % 2 !== 0 ? "lg:direction-rtl" : ""
              }`}
            >
              {/* Image */}
              <div
                className={`story-image overflow-hidden ${
                  i % 2 !== 0 ? "lg:order-2" : ""
                }`}
              >
                <div
                  className="aspect-[4/5] bg-cover bg-center"
                  style={{ backgroundImage: `url('${section.image}')` }}
                />
              </div>

              {/* Text */}
              <div
                className={`story-text ${
                  i % 2 !== 0 ? "lg:order-1" : ""
                }`}
              >
                <span className="text-7xl lg:text-8xl font-serif text-border leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-3xl lg:text-4xl text-charcoal mt-4 tracking-[0.02em]">
                  {section.title}
                </h3>
                <p className="mt-4 text-muted text-base lg:text-lg leading-relaxed max-w-md">
                  {section.description}
                </p>
                <div className="mt-6 h-[1px] w-16 bg-terracotta" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
