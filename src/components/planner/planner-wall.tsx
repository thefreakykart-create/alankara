"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlacedFrame } from "@/lib/types/planner";
import type { FrameType, FrameSize, ProductVariant } from "@/lib/types/product";
import { FRAME_TYPE_LABELS, FRAME_SIZE_LABELS } from "@/lib/types/product";
import { formatINR } from "@/lib/utils";

interface PlannerWallProps {
  wallColor: string;
  frames: PlacedFrame[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onConfigChange: (id: string, frameType: FrameType, size: FrameSize, variant: ProductVariant) => void;
  onDropFromSidebar: (e: React.DragEvent) => void;
  wallRef: React.RefObject<HTMLDivElement | null>;
  availableVariants: Map<string, ProductVariant[]>; // productId -> variants
}

export default function PlannerWall({
  wallColor,
  frames,
  selectedId,
  onSelect,
  onMove,
  onRemove,
  onConfigChange,
  onDropFromSidebar,
  wallRef,
  availableVariants,
}: PlannerWallProps) {
  const dragState = useRef<{
    frameId: string;
    startMouseX: number;
    startMouseY: number;
    startFrameX: number;
    startFrameY: number;
  } | null>(null);

  const [configOpen, setConfigOpen] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent, frame: PlacedFrame) => {
    e.stopPropagation();
    onSelect(frame.id);
    dragState.current = {
      frameId: frame.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFrameX: frame.x,
      startFrameY: frame.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current) return;
    const { frameId, startMouseX, startMouseY, startFrameX, startFrameY } = dragState.current;
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;
    onMove(frameId, startFrameX + dx, startFrameY + dy);
  };

  const handleMouseUp = () => { dragState.current = null; };

  // Touch drag
  const touchState = useRef<{ frameId: string; startTX: number; startTY: number; startFX: number; startFY: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, frame: PlacedFrame) => {
    e.stopPropagation();
    onSelect(frame.id);
    const t = e.touches[0];
    touchState.current = { frameId: frame.id, startTX: t.clientX, startTY: t.clientY, startFX: frame.x, startFY: frame.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.current) return;
    const t = e.touches[0];
    const { frameId, startTX, startTY, startFX, startFY } = touchState.current;
    onMove(frameId, startFX + (t.clientX - startTX), startFY + (t.clientY - startTY));
  };

  const handleTouchEnd = () => { touchState.current = null; };

  const configFrame = frames.find((f) => f.id === configOpen);
  const configPanelLeft = configFrame
    ? configFrame.x + configFrame.w + 10 > 340
      ? Math.max(16, configFrame.x - 230)
      : configFrame.x + configFrame.w + 10
    : 16;

  return (
    <div
      ref={wallRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ backgroundColor: wallColor, transition: "background-color 0.4s ease" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => { onSelect(null); setConfigOpen(null); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropFromSidebar}
    >
      {frames.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="w-16 h-16 border-2 border-dashed border-current opacity-20 rounded-sm" />
          <p className="text-xs tracking-[0.2em] uppercase opacity-30">
            Drag designs here
          </p>
        </div>
      )}

      {frames.map((frame) => {
        const isSelected = frame.id === selectedId;
        return (
          <div
            key={frame.id}
            className={cn(
              "absolute cursor-grab active:cursor-grabbing transition-shadow",
              isSelected && "ring-2 ring-terracotta ring-offset-2"
            )}
            style={{
              left: frame.x,
              top: frame.y,
              width: frame.w,
              height: frame.h,
              boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)",
            }}
            onMouseDown={(e) => handleMouseDown(e, frame)}
            onTouchStart={(e) => handleTouchStart(e, frame)}
            onClick={(e) => { e.stopPropagation(); onSelect(frame.id); }}
          >
            <Image
              src={frame.image}
              alt={frame.productName}
              fill
              sizes="300px"
              className="object-cover pointer-events-none"
              draggable={false}
            />

            {/* Controls (visible on select) */}
            {isSelected && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(frame.id); }}
                  className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md z-10 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfigOpen(frame.id === configOpen ? null : frame.id); }}
                  className="absolute -bottom-3 -right-3 w-6 h-6 bg-charcoal text-white rounded-full flex items-center justify-center shadow-md z-10 hover:bg-terracotta"
                >
                  <Settings2 className="w-3 h-3" />
                </button>
              </>
            )}

            {/* Price tag */}
            {isSelected && (
              <div className="absolute -bottom-8 left-0 right-0 text-center pointer-events-none">
                <span className="text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                  {FRAME_TYPE_LABELS[frame.frameType]} · {FRAME_SIZE_LABELS[frame.size]} · {formatINR(frame.price)}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Config panel for a frame */}
      {configOpen && configFrame && (
        <div
          className="absolute bg-warm-white border border-border rounded-sm shadow-xl p-4 z-20 w-56"
          style={{
            left: configPanelLeft,
            top: configFrame.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-medium text-charcoal mb-3 truncate">{configFrame.productName}</p>

          {/* Frame type */}
          <p className="text-[10px] text-muted tracking-[0.15em] uppercase mb-1.5">Frame Type</p>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {(availableVariants.get(configFrame.productId) ?? [])
              .map((v) => v.frame_type)
              .filter((ft, i, arr) => arr.indexOf(ft) === i)
              .map((ft) => {
                const variant = (availableVariants.get(configFrame.productId) ?? [])
                  .find((v) => v.frame_type === ft && v.size === configFrame.size);
                return (
                  <button
                    key={ft}
                    onClick={() => {
                      const v = (availableVariants.get(configFrame.productId) ?? [])
                        .find((va) => va.frame_type === ft && va.size === configFrame.size);
                      if (v) onConfigChange(configFrame.id, ft as FrameType, configFrame.size, v);
                    }}
                    className={cn(
                      "px-2 py-1 text-[10px] tracking-wider uppercase border rounded-sm transition-all",
                      configFrame.frameType === ft
                        ? "border-charcoal bg-charcoal text-warm-white"
                        : variant
                        ? "border-border text-charcoal hover:border-charcoal"
                        : "border-border text-muted/40 cursor-not-allowed"
                    )}
                    disabled={!variant}
                  >
                    {FRAME_TYPE_LABELS[ft as FrameType]}
                  </button>
                );
              })}
          </div>

          {/* Size */}
          <p className="text-[10px] text-muted tracking-[0.15em] uppercase mb-1.5">Size</p>
          <div className="flex gap-1.5 flex-wrap">
            {(["8x12", "12x18", "18x24", "24x36"] as FrameSize[]).map((size) => {
              const variant = (availableVariants.get(configFrame.productId) ?? [])
                .find((v) => v.frame_type === configFrame.frameType && v.size === size);
              return (
                <button
                  key={size}
                  onClick={() => {
                    if (variant) onConfigChange(configFrame.id, configFrame.frameType, size, variant);
                  }}
                  disabled={!variant}
                  className={cn(
                    "px-2 py-1 text-[10px] tracking-wider uppercase border rounded-sm transition-all",
                    configFrame.size === size
                      ? "border-charcoal bg-charcoal text-warm-white"
                      : variant
                      ? "border-border text-charcoal hover:border-charcoal"
                      : "border-border text-muted/40 cursor-not-allowed"
                  )}
                >
                  {FRAME_SIZE_LABELS[size]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
