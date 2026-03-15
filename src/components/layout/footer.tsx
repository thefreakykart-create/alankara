"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-warm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h2 className="font-serif text-2xl tracking-[0.15em] uppercase mb-4">
              Alankara
            </h2>
            <p className="text-sm text-warm-white/60 leading-relaxed max-w-xs">
              Contemporary Indian home decor that blends heritage craft with
              modern aesthetics. Handcrafted pieces for the mindful home.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="#"
                className="text-warm-white/60 hover:text-terracotta-light transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-warm-white/60 hover:text-terracotta-light transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-warm-white/60 hover:text-terracotta-light transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase mb-6 text-warm-white/40">
              Shop
            </h3>
            <ul className="space-y-3">
              {[
                "All Products",
                "Living Room",
                "Bedroom",
                "Kitchen",
                "Lighting",
                "New Arrivals",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="/products"
                    className="text-sm text-warm-white/60 hover:text-terracotta-light transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase mb-6 text-warm-white/40">
              Company
            </h3>
            <ul className="space-y-3">
              {[
                "Our Story",
                "Artisan Partners",
                "Sustainability",
                "Contact Us",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-warm-white/60 hover:text-terracotta-light transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase mb-6 text-warm-white/40">
              Help
            </h3>
            <ul className="space-y-3">
              {[
                "Shipping & Returns",
                "Order Tracking",
                "FAQs",
                "Privacy Policy",
                "Terms of Service",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-warm-white/60 hover:text-terracotta-light transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-warm-white/10 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-warm-white/40 tracking-wider">
            &copy; {new Date().getFullYear()} Alankara. All rights reserved.
          </p>
          <p className="text-xs text-warm-white/40 tracking-wider">
            Handcrafted with love in India
          </p>
        </div>
      </div>
    </footer>
  );
}
