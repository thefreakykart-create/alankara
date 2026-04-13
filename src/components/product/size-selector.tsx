"use client";

import { cn } from "@/lib/utils";
import type { FrameSize, ProductVariant } from "@/lib/types/product";
import { FRAME_SIZE_LABELS, FRAME_SIZE_CM, type FrameType } from "@/lib/types/product";

interface SizeSelectorProps {
  variants: ProductVariant[];
  activeFrameType: FrameType;
  activeSize: FrameSize | null;
  onSizeChange: (size: FrameSize) => void;
}

// Average person height ~170cm, represented at ~200px in UI
const PERSON_HEIGHT_PX = 160;
const PERSON_HEIGHT_CM = 170;

export default function SizeSelector({
  variants,
  activeFrameType,
  activeSize,
  onSizeChange,
}: SizeSelectorProps) {
  // Sizes available for the active frame type
  const availableSizes = variants
    .filter((v) => v.frame_type === activeFrameType && v.is_active)
    .map((v) => v.size as FrameSize);

  const allSizes: FrameSize[] = ["8x12", "12x18", "18x24", "24x36"];

  const selectedCm = activeSize ? FRAME_SIZE_CM[activeSize] : null;
  const frameHeightPx = selectedCm
    ? (selectedCm.h / PERSON_HEIGHT_CM) * PERSON_HEIGHT_PX
    : null;
  const frameWidthPx = selectedCm && frameHeightPx
    ? (selectedCm.w / selectedCm.h) * frameHeightPx
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-charcoal font-medium tracking-wide">Size</span>
        {activeSize && selectedCm && (
          <span className="text-xs text-muted">
            {selectedCm.w} × {selectedCm.h} cm
          </span>
        )}
      </div>

      {/* Size buttons */}
      <div className="flex gap-2 flex-wrap">
        {allSizes.map((size) => {
          const available = availableSizes.includes(size);
          return (
            <button
              key={size}
              onClick={() => available && onSizeChange(size)}
              disabled={!available}
              className={cn(
                "px-4 py-2.5 text-xs tracking-[0.12em] uppercase border transition-all rounded-sm",
                activeSize === size
                  ? "border-charcoal bg-charcoal text-warm-white"
                  : available
                  ? "border-border text-charcoal hover:border-charcoal"
                  : "border-border text-muted/40 line-through cursor-not-allowed"
              )}
            >
              {FRAME_SIZE_LABELS[size]}
            </button>
          );
        })}
      </div>

      {/* Human scale indicator */}
      {activeSize && frameHeightPx && frameWidthPx && (
        <div className="flex items-end gap-4 pt-2">
          <div className="text-center">
            <div
              className="flex items-end justify-center gap-3"
              style={{ height: `${PERSON_HEIGHT_PX}px` }}
            >
              {/* Person silhouette */}
              <svg
                width="28"
                height={PERSON_HEIGHT_PX}
                viewBox={`0 0 28 ${PERSON_HEIGHT_PX}`}
                fill="none"
                className="opacity-30"
              >
                {/* Head */}
                <circle cx="14" cy="14" r="8" fill="#1A1A1A" />
                {/* Body */}
                <path
                  d={`M8 30 Q14 28 20 30 L22 ${PERSON_HEIGHT_PX - 20} Q14 ${PERSON_HEIGHT_PX - 10} 6 ${PERSON_HEIGHT_PX - 20} Z`}
                  fill="#1A1A1A"
                />
                {/* Legs */}
                <line x1="10" y1={PERSON_HEIGHT_PX - 20} x2="8" y2={PERSON_HEIGHT_PX} stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
                <line x1="18" y1={PERSON_HEIGHT_PX - 20} x2="20" y2={PERSON_HEIGHT_PX} stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
              </svg>

              {/* Frame silhouette */}
              <div
                className="border-2 border-charcoal/40 bg-terracotta/10 rounded-sm flex items-center justify-center"
                style={{
                  width: `${frameWidthPx}px`,
                  height: `${frameHeightPx}px`,
                }}
              >
                <span className="text-[10px] text-charcoal/40 font-medium">
                  {FRAME_SIZE_LABELS[activeSize]}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-muted mt-2 tracking-wider">
              Scale vs 5&apos;7&quot; person
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
