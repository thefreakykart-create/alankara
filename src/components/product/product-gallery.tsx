"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const navigate = (newIndex: number) => {
    setDirection(newIndex > activeIndex ? 1 : -1);
    setActiveIndex(newIndex);
    setIsZoomed(false);
  };

  const next = () => navigate((activeIndex + 1) % images.length);
  const prev = () =>
    navigate((activeIndex - 1 + images.length) % images.length);

  // Swipe handler for mobile
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) next();
    else if (info.offset.x > 50) prev();
  };

  // Zoom on hover (desktop)
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  if (!images.length) return null;

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        ref={imageContainerRef}
        className="relative aspect-[3/4] overflow-hidden rounded-sm bg-warm-white group cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 touch-pan-y"
          >
            <Image
              src={images[activeIndex]}
              alt={`Product image ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn(
                "object-cover transition-transform duration-200",
                isZoomed && "scale-[2] pointer-events-none hidden md:block"
              )}
              style={
                isZoomed
                  ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                  : undefined
              }
              priority={activeIndex === 0}
            />
            {/* Non-zoomed version for mobile / non-hover */}
            <Image
              src={images[activeIndex]}
              alt={`Product image ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn(
                "object-cover md:hidden",
                isZoomed && "md:hidden"
              )}
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-warm-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-warm-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Mobile dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => navigate(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === activeIndex
                    ? "bg-charcoal w-4"
                    : "bg-charcoal/30"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails (desktop) */}
      {images.length > 1 && (
        <div className="hidden md:flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => navigate(i)}
              className={cn(
                "relative w-16 h-20 rounded-sm overflow-hidden border-2 transition-all",
                i === activeIndex
                  ? "border-charcoal"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={img}
                alt={`Thumbnail ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
