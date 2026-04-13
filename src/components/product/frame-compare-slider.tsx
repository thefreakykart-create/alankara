"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { FrameType, ProductVariant } from "@/lib/types/product";
import { FRAME_TYPE_LABELS } from "@/lib/types/product";

interface FrameCompareSliderProps {
  variants: ProductVariant[];
  activeFrameType: FrameType;
  onFrameChange: (frame: FrameType) => void;
}

export default function FrameCompareSlider({
  variants,
  activeFrameType,
  onFrameChange,
}: FrameCompareSliderProps) {
  // Get unique frame types that have images
  const frameTypes = Array.from(
    new Set(variants.filter((v) => v.images.length > 0).map((v) => v.frame_type))
  ) as FrameType[];

  const [sliderPos, setSliderPos] = useState(50); // percent
  const [isDragging, setIsDragging] = useState(false);
  const [comparing, setComparing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get first image for each frame type
  const getImage = (ft: FrameType) =>
    variants.find((v) => v.frame_type === ft && v.images.length > 0)?.images[0] || "";

  const leftFrame = activeFrameType;
  const rightFrameIndex =
    (frameTypes.indexOf(activeFrameType) + 1) % frameTypes.length;
  const rightFrame = frameTypes[rightFrameIndex];

  const updateSlider = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
      setSliderPos(x);
    },
    []
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    updateSlider(e.touches[0].clientX);
  };

  const leftImg = getImage(leftFrame);
  const rightImg = rightFrame ? getImage(rightFrame) : "";

  // If only 1 frame type, no comparison needed
  if (frameTypes.length < 2) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Frame type tabs */}
      <div className="flex gap-2">
        {frameTypes.map((ft) => (
          <button
            key={ft}
            onClick={() => onFrameChange(ft)}
            className={cn(
              "px-4 py-2 text-xs tracking-[0.12em] uppercase border transition-all rounded-sm",
              activeFrameType === ft
                ? "border-charcoal bg-charcoal text-warm-white"
                : "border-border text-muted hover:border-charcoal hover:text-charcoal"
            )}
          >
            {FRAME_TYPE_LABELS[ft]}
          </button>
        ))}

        {/* Compare toggle */}
        <button
          onClick={() => setComparing((c) => !c)}
          className={cn(
            "ml-auto px-4 py-2 text-xs tracking-[0.12em] uppercase border transition-all rounded-sm",
            comparing
              ? "border-terracotta bg-terracotta text-warm-white"
              : "border-border text-muted hover:border-terracotta hover:text-terracotta"
          )}
        >
          {comparing ? "Exit Compare" : "Compare"}
        </button>
      </div>

      {/* Slider / Single image */}
      {comparing && rightFrame ? (
        <div
          ref={containerRef}
          className="relative aspect-[3/4] overflow-hidden rounded-sm cursor-col-resize select-none"
          onMouseMove={handleMouseMove}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => {
            setIsDragging(false);
            // switch to the frame that is more visible
            if (sliderPos > 50) onFrameChange(leftFrame);
            else onFrameChange(rightFrame);
          }}
          onMouseLeave={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        >
          {/* Right image (full) */}
          {rightImg && (
            <Image
              src={rightImg}
              alt={FRAME_TYPE_LABELS[rightFrame]}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover pointer-events-none"
              priority
            />
          )}

          {/* Left image (clipped) */}
          {leftImg && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <div className="relative w-full h-full" style={{ width: `${100 / (sliderPos / 100)}%` }}>
                <Image
                  src={leftImg}
                  alt={FRAME_TYPE_LABELS[leftFrame]}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* Divider line */}
          <div
            className="absolute inset-y-0 w-[2px] bg-warm-white z-10 pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Handle */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-warm-white rounded-full shadow-lg flex items-center justify-center">
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                <path d="M1 5h14M1 5l3-3M1 5l3 3M15 5l-3-3M15 5l-3 3" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
            <span className="text-xs bg-warm-white/90 text-charcoal px-2 py-1 rounded-sm tracking-wider uppercase">
              {FRAME_TYPE_LABELS[leftFrame]}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
            <span className="text-xs bg-warm-white/90 text-charcoal px-2 py-1 rounded-sm tracking-wider uppercase">
              {FRAME_TYPE_LABELS[rightFrame]}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
