export interface CartItem {
  productId: string;
  variantId?: string; // for wall_art products
  name: string;
  price: number; // in paise
  image: string | null;
  quantity: number;
  slug: string;
  // wall_art variant info
  frameType?: string; // e.g. 'Canvas'
  frameSize?: string; // e.g. '12×18"'
}

export function getCartItemId(
  item: Pick<CartItem, "productId" | "variantId">
): string {
  return item.variantId ?? item.productId;
}
