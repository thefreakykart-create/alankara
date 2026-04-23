"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";

interface CheckoutSuccessResetProps {
  orderId: string | null;
}

export default function CheckoutSuccessReset({
  orderId,
}: CheckoutSuccessResetProps) {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    if (!orderId) return;
    clearCart();
  }, [clearCart, orderId]);

  return null;
}
