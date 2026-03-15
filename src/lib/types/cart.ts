export interface CartItem {
  productId: string;
  name: string;
  price: number; // in paise
  image: string | null;
  quantity: number;
  slug: string;
}
