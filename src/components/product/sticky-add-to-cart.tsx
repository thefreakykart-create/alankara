"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/lib/types/product";

export default function StickyAddToCart({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartDrawerStore((s) => s.open);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      // Show when main add-to-cart button is out of view (roughly 600px down)
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAdd = () => {
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

  if (product.stock_quantity === 0) return null;

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
              <p className="text-sm font-medium text-charcoal truncate">
                {product.name}
              </p>
              <p className="text-sm text-terracotta font-medium">
                {formatINR(product.price)}
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="flex-shrink-0 flex items-center gap-2 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase px-6 py-2.5 rounded-sm hover:bg-terracotta transition-colors"
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
