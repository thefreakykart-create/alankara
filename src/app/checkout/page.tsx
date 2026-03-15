"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/utils";
import { INDIAN_STATES, PINCODE_REGEX, SHIPPING_RATES } from "@/lib/constants";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const subtotal = useCartStore((s) => s.getSubtotal());
  const shippingCost =
    subtotal >= SHIPPING_RATES.freeAbove ? 0 : SHIPPING_RATES.standard;
  const total = subtotal + shippingCost;

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isValid =
    form.fullName &&
    form.phone.length === 10 &&
    form.addressLine1 &&
    form.city &&
    form.state &&
    PINCODE_REGEX.test(form.pincode);

  const handlePlaceOrder = async () => {
    if (!isValid || loading) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast("Please sign in to place an order", "error");
        router.push("/account/login");
        return;
      }

      const res = await fetch("/api/phonepe/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          items,
          shippingAddress: form,
          subtotal,
          shippingCost,
          total,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "Failed to place order", "error");
        return;
      }

      // If PhonePe redirect URL is returned, redirect to payment page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      // Demo mode — order created successfully without payment
      clearCart();
      toast("Order placed successfully!");
      router.push(`/checkout/success?orderId=${data.orderId}`);
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen pt-32 pb-20 text-center">
        <div className="max-w-md mx-auto px-6">
          <h1 className="font-serif text-2xl text-charcoal mb-4">
            No Items to Checkout
          </h1>
          <Link
            href="/products"
            className="text-sm text-terracotta underline underline-offset-4"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Shipping Address Form */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-charcoal">
              Shipping Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal transition-colors bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">
                  Phone Number *
                </label>
                <div className="flex">
                  <span className="h-11 px-3 flex items-center border border-r-0 border-border rounded-l-sm text-sm text-muted bg-cream">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) =>
                      updateField(
                        "phone",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    className="w-full h-11 px-4 border border-border rounded-r-sm text-sm focus:outline-none focus:border-charcoal transition-colors bg-transparent"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted mb-1.5">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) => updateField("addressLine1", e.target.value)}
                  placeholder="House/Flat no., Building, Street"
                  className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal transition-colors bg-transparent"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted mb-1.5">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => updateField("addressLine2", e.target.value)}
                  placeholder="Area, Colony (optional)"
                  className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal transition-colors bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal transition-colors bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">
                  State *
                </label>
                <select
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal transition-colors bg-transparent"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">
                  Pincode *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) =>
                    updateField(
                      "pincode",
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal transition-colors bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">
                  Landmark
                </label>
                <input
                  type="text"
                  value={form.landmark}
                  onChange={(e) => updateField("landmark", e.target.value)}
                  placeholder="Optional"
                  className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal transition-colors bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="bg-warm-white rounded-sm p-6 space-y-4">
              <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-charcoal">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-12 h-14 flex-shrink-0 bg-cream rounded-sm overflow-hidden">
                      <Image
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-charcoal text-warm-white text-[9px] rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-charcoal line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted">
                        {formatINR(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span>
                    {shippingCost === 0 ? "Free" : formatINR(shippingCost)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={!isValid || loading}
                className="w-full h-11 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {loading ? "Processing..." : `Pay ${formatINR(total)}`}
              </button>

              <p className="text-[10px] text-muted text-center">
                Secured by PhonePe Payment Gateway
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
