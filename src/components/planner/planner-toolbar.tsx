"use client";

import { ShoppingBag, Camera, Trash2, LayoutGrid, AlignHorizontalJustifyCenter, Layers, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import type { Arrangement } from "@/lib/types/planner";
import { WALL_COLORS } from "@/lib/types/planner";

interface PlannerToolbarProps {
  wallColor: string;
  onWallColorChange: (color: string) => void;
  totalPrice: number;
  frameCount: number;
  onAddAllToCart: () => void;
  onScreenshot: () => void;
  onClearAll: () => void;
  onArrange: (arrangement: Arrangement) => void;
  cartAdded: boolean;
}

const ARRANGEMENTS: { key: Arrangement; label: string; icon: React.ReactNode }[] = [
  { key: "grid", label: "Grid", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { key: "row", label: "Row", icon: <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" /> },
  { key: "salon", label: "Salon", icon: <Layers className="w-3.5 h-3.5" /> },
  { key: "asymmetric", label: "Asymm.", icon: <Wand2 className="w-3.5 h-3.5" /> },
];

export default function PlannerToolbar({
  wallColor,
  onWallColorChange,
  totalPrice,
  frameCount,
  onAddAllToCart,
  onScreenshot,
  onClearAll,
  onArrange,
  cartAdded,
}: PlannerToolbarProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-warm-white flex-wrap">

      {/* Wall color swatches */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted tracking-[0.15em] uppercase hidden sm:block">Wall</span>
        <div className="flex gap-1.5">
          {WALL_COLORS.map((c) => (
            <button
              key={c.color}
              title={c.label}
              onClick={() => onWallColorChange(c.color)}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-all",
                wallColor === c.color ? "border-charcoal scale-110" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: c.color, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }}
            />
          ))}
        </div>
      </div>

      <div className="h-4 w-px bg-border hidden sm:block" />

      {/* Arrangement presets */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted tracking-[0.15em] uppercase hidden sm:block">Arrange</span>
        {ARRANGEMENTS.map((a) => (
          <button
            key={a.key}
            onClick={() => onArrange(a.key)}
            disabled={frameCount < 2}
            title={a.label}
            className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-muted border border-border rounded-sm hover:border-charcoal hover:text-charcoal transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {a.icon}
            <span className="hidden lg:inline">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-border hidden sm:block" />

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {frameCount > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-muted border border-border rounded-sm hover:border-red-400 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}

        <button
          onClick={onScreenshot}
          disabled={frameCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-charcoal border border-border rounded-sm hover:border-charcoal transition-all disabled:opacity-30"
        >
          <Camera className="w-3 h-3" />
          Save
        </button>

        <button
          onClick={onAddAllToCart}
          disabled={frameCount === 0 || cartAdded}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-xs font-medium tracking-wide uppercase rounded-sm transition-all disabled:opacity-40",
            cartAdded
              ? "bg-emerald text-warm-white"
              : "bg-charcoal text-warm-white hover:bg-terracotta"
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {cartAdded
            ? "Added!"
            : frameCount > 0
            ? `Add ${frameCount} · ${formatINR(totalPrice)}`
            : "Add All to Cart"}
        </button>
      </div>
    </div>
  );
}
