"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatINR } from "@/lib/utils";
import { SHIPPING_RATES } from "@/lib/constants";

export default function CartPage() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const { items, removeItem, updateQuantity } = useCartStore();
  const subtotal = useCartStore((s) => s.getSubtotal());
  const itemCount = useCartStore((s) => s.getItemCount());

  if (!hydrated) return null;
  const shippingCost =
    subtotal >= SHIPPING_RATES.freeAbove ? 0 : SHIPPING_RATES.standard;
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <main className="min-h-screen pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <ShoppingBag className="w-16 h-16 text-border mx-auto mb-4" />
          <h1 className="font-serif text-2xl text-charcoal tracking-wide mb-2">
            Your Cart is Empty
          </h1>
          <p className="text-sm text-muted mb-8">
            Discover our handcrafted collection and find something you love.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase px-8 py-3 rounded-sm hover:bg-terracotta transition-colors"
          >
            Shop Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide mb-8">
          Shopping Cart{" "}
          <span className="text-base text-muted font-sans">
            ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 divide-y divide-border">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 py-6 first:pt-0"
              >
                {/* Image */}
                <Link
                  href={`/products/${item.slug}`}
                  className="relative w-24 h-32 flex-shrink-0 bg-warm-white rounded-sm overflow-hidden"
                >
                  <Image
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-sm font-medium text-charcoal hover:text-terracotta transition-colors line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-charcoal mt-1">
                    {formatINR(item.price)}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-8 h-8 border border-border rounded-sm flex items-center justify-center hover:border-charcoal transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-8 h-8 border border-border rounded-sm flex items-center justify-center hover:border-charcoal transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-muted hover:text-red-500 transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Line total */}
                <div className="text-sm font-medium text-charcoal whitespace-nowrap hidden sm:block">
                  {formatINR(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="bg-warm-white rounded-sm p-6 space-y-4">
              <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-charcoal">
                Order Summary
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-charcoal">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span className="text-charcoal">
                    {shippingCost === 0 ? "Free" : formatINR(shippingCost)}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-terracotta">
                    Add {formatINR(SHIPPING_RATES.freeAbove - subtotal)} more
                    for free shipping
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-3 flex justify-between text-sm font-medium">
                <span className="text-charcoal">Total</span>
                <span className="text-charcoal">{formatINR(total)}</span>
              </div>

              <Link
                href="/checkout"
                className="block w-full h-11 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-terracotta transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/products"
                className="block text-center text-xs text-muted hover:text-charcoal transition-colors underline underline-offset-4"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
