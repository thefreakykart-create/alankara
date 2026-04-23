"use client";

import { useState, useRef, useCallback } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { useToast } from "@/components/ui/toast";
import PlannerWall from "./planner-wall";
import PlannerSidebar from "./planner-sidebar";
import PlannerToolbar from "./planner-toolbar";
import type { PlacedFrame, Arrangement } from "@/lib/types/planner";
import type { Product, ProductVariant, FrameType, FrameSize } from "@/lib/types/product";
import { FRAME_SIZE_CM, FRAME_SIZE_LABELS, FRAME_TYPE_LABELS } from "@/lib/types/product";
import { formatINR } from "@/lib/utils";

// Wall canvas scale: 1cm = N px (at default)
const CM_TO_PX = 8;

function frameSizePx(size: FrameSize) {
  const cm = FRAME_SIZE_CM[size];
  return { w: cm.w * CM_TO_PX, h: cm.h * CM_TO_PX };
}

interface GalleryWallPlannerProps {
  products: (Product & { variants: ProductVariant[] })[];
}

export default function GalleryWallPlanner({ products }: GalleryWallPlannerProps) {
  const [frames, setFrames] = useState<PlacedFrame[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wallColor, setWallColor] = useState("#FAF7F2");
  const [cartAdded, setCartAdded] = useState(false);

  const wallRef = useRef<HTMLDivElement>(null);
  const dragProductRef = useRef<(Product & { variants: ProductVariant[] }) | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartDrawerStore((s) => s.open);
  const { toast } = useToast();

  // Build variant map for config panel
  const availableVariants = new Map<string, ProductVariant[]>();
  products.forEach((p) => availableVariants.set(p.id, p.variants));

  const totalPrice = frames.reduce((sum, f) => sum + f.price, 0);

  // ── Add frame from product ──
  const addFrameFromProduct = useCallback(
    (product: Product & { variants: ProductVariant[] }, dropX?: number, dropY?: number) => {
      const wall = wallRef.current;
      if (!wall) return;
      const firstVariant = product.variants.find((v) => v.is_active);
      if (!firstVariant) return;

      const size = firstVariant.size as FrameSize;
      const { w, h } = frameSizePx(size);
      const wallRect = wall.getBoundingClientRect();

      const x = dropX !== undefined ? dropX - wallRect.left - w / 2 : wallRect.width / 2 - w / 2 + (frames.length % 4) * 20;
      const y = dropY !== undefined ? dropY - wallRect.top - h / 2 : 60 + (frames.length % 3) * 20;

      const placed: PlacedFrame = {
        id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantId: firstVariant.id,
        frameType: firstVariant.frame_type as FrameType,
        size,
        price: firstVariant.price,
        image: firstVariant.images?.[0] || product.images?.[0] || "",
        x: Math.max(0, x),
        y: Math.max(0, y),
        w,
        h,
      };
      setFrames((prev) => [...prev, placed]);
      setSelectedId(placed.id);
    },
    [frames.length]
  );

  // ── Drag from sidebar ──
  const handleSidebarDragStart = (e: React.DragEvent, product: Product & { variants: ProductVariant[] }) => {
    dragProductRef.current = product;
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropOnWall = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragProductRef.current) return;
    addFrameFromProduct(dragProductRef.current, e.clientX, e.clientY);
    dragProductRef.current = null;
  };

  // ── Move frame ──
  const handleMove = useCallback((id: string, x: number, y: number) => {
    const wall = wallRef.current;
    if (!wall) return;
    setFrames((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        return {
          ...f,
          x: Math.max(0, Math.min(wall.clientWidth - f.w, x)),
          y: Math.max(0, Math.min(wall.clientHeight - f.h, y)),
        };
      })
    );
  }, []);

  // ── Remove frame ──
  const handleRemove = (id: string) => {
    setFrames((prev) => prev.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // ── Config change (frame type / size) ──
  const handleConfigChange = (id: string, frameType: FrameType, size: FrameSize, variant: ProductVariant) => {
    const { w, h } = frameSizePx(size);
    setFrames((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              frameType,
              size,
              variantId: variant.id,
              price: variant.price,
              image: variant.images?.[0] || f.image,
              w,
              h,
            }
          : f
      )
    );
  };

  // ── Arrangement presets ──
  const handleArrange = (arrangement: Arrangement) => {
    const wall = wallRef.current;
    if (!wall || frames.length === 0) return;
    const W = wall.clientWidth;
    const H = wall.clientHeight;
    const padding = 24;
    const gap = 20;

    let updated: PlacedFrame[] = [];

    if (arrangement === "grid") {
      const cols = Math.ceil(Math.sqrt(frames.length));
      updated = frames.map((f, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return { ...f, x: padding + col * (f.w + gap), y: padding + row * (f.h + gap) };
      });
    } else if (arrangement === "row") {
      const totalW = frames.reduce((s, f) => s + f.w, 0) + gap * (frames.length - 1);
      let x = (W - totalW) / 2;
      const midY = H / 2;
      updated = frames.map((f) => {
        const placed = { ...f, x, y: midY - f.h / 2 };
        x += f.w + gap;
        return placed;
      });
    } else if (arrangement === "salon") {
      // Staggered rows — mixed heights, organic feel
      const cols = Math.ceil(frames.length / 2);
      updated = frames.map((f, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const offsetY = col % 2 === 0 ? 0 : 40;
        return { ...f, x: padding + col * (f.w + gap), y: padding + offsetY + row * (f.h + gap + 20) };
      });
    } else if (arrangement === "asymmetric") {
      // Large center + smaller around
      const center = frames[0];
      const rest = frames.slice(1);
      const cx = W / 2 - center.w / 2;
      const cy = H / 2 - center.h / 2;
      updated = [{ ...center, x: cx, y: cy }];
      const positions = [
        { x: cx - rest[0]?.w - gap, y: cy },
        { x: cx + center.w + gap, y: cy },
        { x: cx, y: cy - (rest[2]?.h ?? 160) - gap },
        { x: cx, y: cy + center.h + gap },
      ];
      rest.forEach((f, i) => {
        const pos = positions[i] ?? { x: padding + i * (f.w + gap), y: padding };
        updated.push({ ...f, x: pos.x, y: pos.y });
      });
    }

    setFrames(updated);
  };

  // ── Add all to cart ──
  const handleAddAllToCart = () => {
    frames.forEach((f) => {
      addItem({
        productId: f.productId,
        variantId: f.variantId,
        name: `${f.productName} — ${FRAME_TYPE_LABELS[f.frameType]}`,
        price: f.price,
        image: f.image,
        quantity: 1,
        slug: f.productSlug,
        frameType: FRAME_TYPE_LABELS[f.frameType],
        frameSize: FRAME_SIZE_LABELS[f.size],
      });
    });
    setCartAdded(true);
    toast(`${frames.length} frame${frames.length > 1 ? "s" : ""} added to cart — ${formatINR(totalPrice)}`);
    openCart();
    setTimeout(() => setCartAdded(false), 3000);
  };

  // ── Screenshot ──
  const handleScreenshot = async () => {
    const wall = wallRef.current;
    if (!wall) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(wall, { useCORS: true, allowTaint: false, scale: 2 });
      const link = document.createElement("a");
      link.download = "my-gallery-wall.jpg";
      link.href = canvas.toDataURL("image/jpeg", 0.92);
      link.click();
      toast("Gallery wall saved!");
    } catch {
      toast("Screenshot failed — try a different browser.");
    }
  };

  // Mobile: sidebar toggled by button
  const [mobileSidebar, setMobileSidebar] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <PlannerToolbar
        wallColor={wallColor}
        onWallColorChange={setWallColor}
        totalPrice={totalPrice}
        frameCount={frames.length}
        onAddAllToCart={handleAddAllToCart}
        onScreenshot={handleScreenshot}
        onClearAll={() => { setFrames([]); setSelectedId(null); }}
        onArrange={handleArrange}
        cartAdded={cartAdded}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar (desktop) */}
        <div className={`hidden md:flex flex-col w-52 flex-shrink-0 border-r border-border overflow-hidden`}>
          <PlannerSidebar
            products={products}
            onDragStart={handleSidebarDragStart}
            onTap={(p) => addFrameFromProduct(p)}
          />
        </div>

        {/* Wall */}
        <div className="flex-1 overflow-hidden relative">
          <PlannerWall
            wallColor={wallColor}
            frames={frames}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={handleMove}
            onRemove={handleRemove}
            onConfigChange={handleConfigChange}
            onDropFromSidebar={handleDropOnWall}
            wallRef={wallRef}
            availableVariants={availableVariants}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebar && (
          <div className="absolute inset-0 z-30 flex md:hidden">
            <div className="w-64 h-full flex flex-col bg-warm-white border-r border-border">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-xs text-muted tracking-[0.15em] uppercase">Designs</p>
                <button onClick={() => setMobileSidebar(false)} className="text-muted text-xs underline">Done</button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PlannerSidebar
                  products={products}
                  onDragStart={handleSidebarDragStart}
                  onTap={(p) => { addFrameFromProduct(p); setMobileSidebar(false); }}
                />
              </div>
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setMobileSidebar(false)} />
          </div>
        )}
      </div>

      {/* Mobile add button */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-t border-border bg-warm-white">
        <button
          onClick={() => setMobileSidebar(true)}
          className="px-4 py-2 border border-border text-xs text-charcoal rounded-sm hover:border-charcoal tracking-wider uppercase"
        >
          + Add Design
        </button>
        {frames.length > 0 && (
          <p className="text-xs text-muted">
            {frames.length} frame{frames.length > 1 ? "s" : ""} · {formatINR(totalPrice)}
          </p>
        )}
      </div>
    </div>
  );
}
