"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, X, Search, User } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/products?category=living-room", label: "Living Room" },
  { href: "/products?category=bedroom", label: "Bedroom" },
  { href: "/products?category=kitchen-dining", label: "Kitchen" },
  { href: "/products?category=lighting", label: "Lighting" },
  { href: "/planner", label: "Wall Planner" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCart = useCartDrawerStore((s) => s.open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const iconCls = cn(
    "transition-colors duration-300",
    scrolled ? "text-warm-white/80 hover:text-warm-white" : "text-charcoal/70 hover:text-charcoal"
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">

        {/* Announcement bar */}
        <div className={cn(
          "text-center text-[10px] tracking-[0.22em] uppercase font-medium transition-all duration-500 overflow-hidden",
          scrolled
            ? "h-0 opacity-0"
            : "h-8 bg-charcoal text-warm-white/70 flex items-center justify-center"
        )}>
          Free Shipping on Orders Above ₹999
        </div>

        {/* Main nav bar */}
        <div className={cn(
          "transition-all duration-500",
          scrolled
            ? "bg-charcoal/95 backdrop-blur-md h-14"
            : "bg-warm-white/90 backdrop-blur-sm h-16 lg:h-20 border-b border-charcoal/6"
        )}>
          <div className="max-w-7xl mx-auto px-5 lg:px-8 h-full flex items-center justify-between gap-6">

            {/* Left nav — desktop */}
            <nav className="hidden lg:flex items-center gap-7 flex-1">
              {NAV_LINKS.slice(0, 3).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative text-[11px] tracking-[0.14em] uppercase font-medium transition-colors duration-300 py-1 group",
                    scrolled ? "text-warm-white/70 hover:text-warm-white" : "text-charcoal/60 hover:text-charcoal"
                  )}
                >
                  {link.label}
                  <span className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] w-0 group-hover:w-full transition-all duration-300 rounded-full",
                    scrolled ? "bg-warm-white/60" : "bg-terracotta"
                  )} />
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(true)}
              className={cn("lg:hidden flex flex-col gap-[5px] p-1", iconCls)}
              aria-label="Open menu"
            >
              <span className={cn("block h-px w-5 transition-colors", scrolled ? "bg-warm-white/80" : "bg-charcoal")} />
              <span className={cn("block h-px w-3.5 transition-colors", scrolled ? "bg-warm-white/80" : "bg-charcoal")} />
            </button>

            {/* Logo — center */}
            <Link href="/" className="flex flex-col items-center gap-0.5 group flex-none">
              <div className={cn(
                "flex items-center gap-2 transition-colors duration-300",
                scrolled ? "text-warm-white" : "text-charcoal"
              )}>
                <span className={cn(
                  "text-[10px] transition-opacity duration-300",
                  scrolled ? "opacity-40" : "opacity-30"
                )}>✦</span>
                <span className={cn(
                  "font-serif tracking-[0.22em] uppercase transition-all duration-300",
                  scrolled ? "text-xl" : "text-2xl lg:text-3xl"
                )}>
                  Alankara
                </span>
                <span className={cn(
                  "text-[10px] transition-opacity duration-300",
                  scrolled ? "opacity-40" : "opacity-30"
                )}>✦</span>
              </div>
              {!scrolled && (
                <span className="text-[8px] tracking-[0.35em] uppercase text-charcoal/30 font-medium hidden lg:block">
                  Home · Art · Decor
                </span>
              )}
            </Link>

            {/* Right nav — desktop */}
            <nav className="hidden lg:flex items-center gap-7 flex-1 justify-end">
              {NAV_LINKS.slice(3).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative text-[11px] tracking-[0.14em] uppercase font-medium transition-colors duration-300 py-1 group",
                    scrolled ? "text-warm-white/70 hover:text-warm-white" : "text-charcoal/60 hover:text-charcoal",
                    link.label === "Wall Planner" && "flex items-center gap-1"
                  )}
                >
                  {link.label}
                  {link.label === "Wall Planner" && (
                    <span className={cn("text-[9px]", scrolled ? "text-warm-white/40" : "text-terracotta/60")}>✦</span>
                  )}
                  <span className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] w-0 group-hover:w-full transition-all duration-300 rounded-full",
                    scrolled ? "bg-warm-white/60" : "bg-terracotta"
                  )} />
                </Link>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-1">
              <button className={cn("p-2 rounded-full transition-colors", iconCls)} aria-label="Search">
                <Search className="w-4 h-4" />
              </button>
              <Link href="/account" className={cn("p-2 rounded-full transition-colors hidden sm:flex", iconCls)} aria-label="Account">
                <User className="w-4 h-4" />
              </Link>
              <button
                onClick={openCart}
                className={cn("p-2 rounded-full transition-colors relative", iconCls)}
                aria-label="Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-terracotta text-white text-[9px] rounded-full flex items-center justify-center font-bold"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Full-screen mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-charcoal flex flex-col lg:hidden"
          >
            {/* Close button */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-warm-white/10">
              <span className="font-serif text-xl tracking-[0.2em] text-warm-white/80">
                ✦ Alankara
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-warm-white/60 hover:text-warm-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 flex flex-col justify-center px-8 gap-1">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-baseline gap-3 py-3 border-b border-warm-white/8"
                  >
                    <span className="text-[10px] text-warm-white/20 w-4 font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-3xl text-warm-white/80 group-hover:text-warm-white transition-colors duration-200 tracking-wide">
                      {link.label}
                    </span>
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.06 }}
              >
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-baseline gap-3 py-3 border-b border-warm-white/8"
                >
                  <span className="text-[10px] text-warm-white/20 w-4 font-mono">
                    {String(NAV_LINKS.length + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-3xl text-warm-white/80 group-hover:text-warm-white transition-colors duration-200 tracking-wide">
                    Account
                  </span>
                </Link>
              </motion.div>
            </nav>

            {/* Bottom row */}
            <div className="px-8 pb-10 pt-4 flex items-center justify-between">
              <p className="text-[10px] tracking-[0.2em] uppercase text-warm-white/25">
                Free shipping above ₹999
              </p>
              <button
                onClick={() => { setMenuOpen(false); openCart(); }}
                className="flex items-center gap-2 text-xs tracking-widest uppercase text-warm-white/50 hover:text-warm-white transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                {itemCount > 0 ? `Cart (${itemCount})` : "Cart"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
