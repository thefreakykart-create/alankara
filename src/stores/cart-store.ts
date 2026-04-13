"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types/cart";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // For variants, match by variantId; for general products match by productId
          const key = item.variantId ?? item.productId;
          const existing = state.items.find(
            (i) => (i.variantId ?? i.productId) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                (i.variantId ?? i.productId) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => (i.variantId ?? i.productId) !== productId
          ),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => (i.variantId ?? i.productId) !== productId)
              : state.items.map((i) =>
                  (i.variantId ?? i.productId) === productId ? { ...i, quantity } : i
                ),
        })),

      clearCart: () => set({ items: [] }),

      getItemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "alankara-cart",
    }
  )
);
