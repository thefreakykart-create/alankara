import Link from "next/link";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed — Alankara",
};

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 flex items-start justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="w-16 h-16 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald" />
        </div>
        <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide mb-3">
          Order Confirmed
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-8">
          Thank you for your purchase! You&apos;ll receive an order confirmation
          email shortly. Your handcrafted pieces are being prepared with care.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center h-11 px-8 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-terracotta transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/account"
            className="inline-flex items-center justify-center h-11 px-8 border border-charcoal text-charcoal text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-charcoal hover:text-warm-white transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>
    </main>
  );
}
