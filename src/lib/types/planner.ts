import type { FrameType, FrameSize, Product, ProductVariant } from "./product";

export interface PlacedFrame {
  id: string;           // unique instance id
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  frameType: FrameType;
  size: FrameSize;
  price: number;        // in paise
  image: string;
  // Position on the wall (px from top-left of wall canvas)
  x: number;
  y: number;
  // Display size on canvas (derived from size + wall scale)
  w: number;
  h: number;
}

export interface WallConfig {
  color: string;
  label: string;
}

export const WALL_COLORS: WallConfig[] = [
  { color: "#FAF7F2", label: "Cream" },
  { color: "#FFFDF9", label: "Warm White" },
  { color: "#F5F0E8", label: "Linen" },
  { color: "#E8E0D5", label: "Greige" },
  { color: "#D4C5B0", label: "Sand" },
  { color: "#2D6A4F", label: "Forest" },
  { color: "#800020", label: "Burgundy" },
  { color: "#1A1A2E", label: "Navy" },
  { color: "#1A1A1A", label: "Charcoal" },
  { color: "#F0EBE3", label: "Blush" },
];

export type Arrangement = "grid" | "row" | "salon" | "asymmetric";
