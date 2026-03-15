"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { formatINR } from "@/lib/utils";
import { SHIPPING_RATES } from "@/lib/constants";

export default function CartDrawer() {
  const { isOpen, close } = useCartDrawerStore();
  const { items, removeItem, updateQuantity } = useCartStore();
  const subtotal = useCartStore((s) => s.getSubtotal());
  const itemCount = useCartStore((s) => s.getItemCount());
  const shippingCost =
    subtotal >= SHIPPING_RATES.freeAbove ? 0 : SHIPPING_RATES.standard;

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-charcoal/40 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-cream z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-charcoal">
                Cart ({itemCount})
              </h2>
              <button
                onClick={close}
                className="p-1 hover:text-terracotta transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <ShoppingBag className="w-12 h-12 text-border mb-4" />
                <p className="text-sm text-muted mb-6">Your cart is empty</p>
                <button
                  onClick={close}
                  className="text-sm text-charcoal underline underline-offset-4 hover:text-terracotta transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={close}
                        className="relative w-20 h-24 flex-shrink-0 bg-warm-white rounded-sm overflow-hidden"
                      >
                        <Image
                          src={item.image || "/placeholder.jpg"}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={close}
                          className="text-sm font-medium text-charcoal hover:text-terracotta transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-muted mt-0.5">
                          {formatINR(item.price)}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                              className="w-7 h-7 border border-border rounded-sm flex items-center justify-center hover:border-charcoal transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                              className="w-7 h-7 border border-border rounded-sm flex items-center justify-center hover:border-charcoal transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-border px-6 py-4 space-y-3">
                  {shippingCost > 0 && subtotal > 0 && (
                    <p className="text-xs text-terracotta text-center">
                      Add {formatINR(SHIPPING_RATES.freeAbove - subtotal)} more
                      for free shipping
                    </p>
                  )}
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted">Subtotal</span>
                    <span className="text-charcoal">{formatINR(subtotal)}</span>
                  </div>
                  <Link
                    href="/cart"
                    onClick={close}
                    className="block w-full h-11 border border-charcoal text-charcoal text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-charcoal hover:text-warm-white transition-colors flex items-center justify-center"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="block w-full h-11 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-terracotta transition-colors flex items-center justify-center gap-2"
                  >
                    Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
