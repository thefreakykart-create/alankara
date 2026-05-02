"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/lib/types/product";

interface Props {
  product: Product;
  overridePrice?: number;
  onAdd?: () => void;
  disabled?: boolean;
}

export default function StickyAddToCart({ product, overridePrice, onAdd, disabled }: Props) {
  const [visible, setVisible] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartDrawerStore((s) => s.open);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAdd = () => {
    if (onAdd) { onAdd(); return; }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      quantity: 1,
      slug: product.slug,
    });
    toast(`${product.name} added to cart`);
    openCart();
  };

  const displayPrice = overridePrice ?? product.price;
  const isDisabled = disabled ?? product.stock_quantity === 0;

  if (!overridePrice && product.stock_quantity === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-t border-border px-6 py-3 lg:hidden"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">{product.name}</p>
              <p className="text-sm text-terracotta font-medium">
                {displayPrice > 0 ? formatINR(displayPrice) : "Select size first"}
              </p>
            </div>
            <button
              onClick={handleAdd}
              disabled={isDisabled || displayPrice === 0}
              className="flex-shrink-0 flex items-center gap-2 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase px-6 py-2.5 rounded-sm hover:bg-terracotta transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              Add
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
