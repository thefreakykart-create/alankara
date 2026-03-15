export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number; // in paise
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
}
