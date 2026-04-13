"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FrameType } from "@/lib/types/product";
import { FRAME_TYPE_LABELS, FRAME_TYPE_DESCRIPTIONS } from "@/lib/types/product";

const MATERIAL_DETAILS: Record<FrameType, {
  material: string;
  finish: string;
  bestFor: string;
  texture: string; // CSS gradient to simulate texture
}> = {
  canvas: {
    material: "Premium poly-cotton canvas",
    finish: "Matte UV-resistant inks",
    bestFor: "Living rooms, bedrooms, traditional spaces",
    texture: "repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 4px)",
  },
  acrylic: {
    material: "4mm clear acrylic glass",
    finish: "High-gloss face mount print",
    bestFor: "Modern offices, minimal apartments, feature walls",
    texture: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)",
  },
  wooden: {
    material: "Solid MDF with black border",
    finish: "Satin finish, scratch-resistant",
    bestFor: "Hallways, dining areas, eclectic and boho spaces",
    texture: "repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 8px)",
  },
};

const FRAME_COLORS: Record<FrameType, string> = {
  canvas: "bg-amber-50",
  acrylic: "bg-sky-50",
  wooden: "bg-stone-100",
};

interface MaterialCloseupProps {
  availableFrameTypes: FrameType[];
  activeFrameType: FrameType;
  onFrameChange: (ft: FrameType) => void;
}

export default function MaterialCloseup({
  availableFrameTypes,
  activeFrameType,
  onFrameChange,
}: MaterialCloseupProps) {
  const [hovered, setHovered] = useState<FrameType | null>(null);
  const displayed = hovered || activeFrameType;
  const details = MATERIAL_DETAILS[displayed];

  return (
    <div className="border-t border-border pt-8 space-y-6">
      <div>
        <span className="text-xs tracking-[0.25em] uppercase text-muted">Material & Finish</span>
        <h3 className="font-serif text-xl text-charcoal mt-1">Feel the Difference</h3>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        {availableFrameTypes.map((ft) => {
          const d = MATERIAL_DETAILS[ft];
          const isActive = displayed === ft;
          return (
            <button
              key={ft}
              onClick={() => onFrameChange(ft)}
              onMouseEnter={() => setHovered(ft)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "relative overflow-hidden rounded-sm p-4 text-left transition-all border",
                isActive
                  ? "border-charcoal shadow-md"
                  : "border-border hover:border-charcoal/40"
              )}
            >
              {/* Texture preview */}
              <div
                className={cn("w-full aspect-square rounded-sm mb-3", FRAME_COLORS[ft])}
                style={{ backgroundImage: d.texture }}
              />
              <p className={cn(
                "text-xs font-medium tracking-[0.1em] uppercase transition-colors",
                isActive ? "text-charcoal" : "text-muted"
              )}>
                {FRAME_TYPE_LABELS[ft]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div className="bg-cream rounded-sm p-5 space-y-3">
        <p className="font-serif text-lg text-charcoal">{FRAME_TYPE_LABELS[displayed]}</p>
        <p className="text-sm text-muted leading-relaxed">{FRAME_TYPE_DESCRIPTIONS[displayed]}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-muted">Material</p>
            <p className="text-xs text-charcoal mt-0.5">{details.material}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-muted">Finish</p>
            <p className="text-xs text-charcoal mt-0.5">{details.finish}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] tracking-[0.15em] uppercase text-muted">Best For</p>
            <p className="text-xs text-charcoal mt-0.5">{details.bestFor}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
