"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { formatINR, getDiscountPercent } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/lib/types/product";

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = product.compare_at_price
    ? getDiscountPercent(product.price, product.compare_at_price)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      quantity: 1,
      slug: product.slug,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      <Link href={`/products/${product.slug}`} className="group block">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-warm-white">
          <Image
            src={product.images?.[0] || "/placeholder.jpg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-burgundy text-warm-white text-xs font-medium px-2.5 py-1 tracking-wider uppercase">
              {discount}% Off
            </span>
          )}

          {/* Out of stock overlay */}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-charcoal/40 flex items-center justify-center">
              <span className="bg-warm-white text-charcoal text-sm font-medium px-4 py-2 tracking-wider uppercase">
                Sold Out
              </span>
            </div>
          )}

          {/* Quick add button */}
          {product.stock_quantity > 0 && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-3 right-3 w-10 h-10 bg-charcoal/80 text-warm-white rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-terracotta"
              aria-label="Add to cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1">
          {product.category && (
            <p className="text-xs text-muted tracking-[0.1em] uppercase">
              {product.category.name}
            </p>
          )}
          <h3 className="text-sm font-medium text-charcoal leading-snug group-hover:text-terracotta transition-colors duration-300">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-charcoal">
              {formatINR(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-xs text-muted line-through">
                {formatINR(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
