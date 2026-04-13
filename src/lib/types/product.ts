export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
}

export type FrameType = 'canvas' | 'acrylic' | 'wooden';
export type FrameSize = '8x12' | '12x18' | '18x24' | '24x36';
export type ProductType = 'general' | 'wall_art';

export interface ProductVariant {
  id: string;
  product_id: string;
  frame_type: FrameType;
  size: FrameSize;
  price: number; // in paise
  compare_at_price: number | null; // in paise
  sku: string | null;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_type: ProductType;
  price: number; // in paise (used for general products)
  compare_at_price: number | null; // in paise
  category_id: string | null;
  category?: Category;
  images: string[];
  sku: string | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  weight_grams: number | null;
  dimensions_cm: {
    length: number;
    width: number;
    height: number;
  } | null;
  metadata: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  // wall_art products have variants
  variants?: ProductVariant[];
}

export const FRAME_TYPE_LABELS: Record<FrameType, string> = {
  canvas: 'Canvas',
  acrylic: 'Acrylic',
  wooden: 'Wooden',
};

export const FRAME_TYPE_DESCRIPTIONS: Record<FrameType, string> = {
  canvas: 'Matte finish with a warm, painterly texture. Classic and timeless.',
  acrylic: 'Glossy, vibrant and sharp. Colours pop with depth and brilliance.',
  wooden: 'Clean black border with a natural finish. Bold and contemporary.',
};

export const FRAME_SIZE_LABELS: Record<FrameSize, string> = {
  '8x12': '8×12"',
  '12x18': '12×18"',
  '18x24': '18×24"',
  '24x36': '24×36"',
};

// Size in cm for human scale indicator (width x height in cm)
export const FRAME_SIZE_CM: Record<FrameSize, { w: number; h: number }> = {
  '8x12':  { w: 20, h: 30 },
  '12x18': { w: 30, h: 46 },
  '18x24': { w: 46, h: 61 },
  '24x36': { w: 61, h: 91 },
};
