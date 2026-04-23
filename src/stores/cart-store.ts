"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCartItemId, type CartItem } from "@/lib/types/cart";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
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
          const key = getCartItemId(item);
          const existing = state.items.find(
            (i) => getCartItemId(i) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                getCartItemId(i) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((i) => getCartItemId(i) !== lineId),
        })),

      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => getCartItemId(i) !== lineId)
              : state.items.map((i) =>
                  getCartItemId(i) === lineId ? { ...i, quantity } : i
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
