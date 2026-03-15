"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types/product";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({ title, children, defaultOpen }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen || false);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium tracking-[0.05em] uppercase text-charcoal">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-muted leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetailsAccordion({
  product,
}: {
  product: Product;
}) {
  const meta = product.metadata || {};

  return (
    <div className="border-t border-border">
      {product.description && (
        <AccordionItem title="Description" defaultOpen>
          <p>{product.description}</p>
        </AccordionItem>
      )}

      {Object.keys(meta).length > 0 && (
        <AccordionItem title="Details">
          <ul className="space-y-2">
            {Object.entries(meta).map(([key, value]) => (
              <li key={key} className="flex">
                <span className="w-28 flex-shrink-0 text-charcoal capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </AccordionItem>
      )}

      <AccordionItem title="Shipping">
        <ul className="space-y-1.5">
          <li>Free shipping on orders above ₹999</li>
          <li>Standard delivery: 5-7 business days (₹99)</li>
          <li>Express delivery: 2-3 business days (₹199)</li>
          <li>Currently shipping across India only</li>
        </ul>
      </AccordionItem>

      <AccordionItem title="Returns & Care">
        <ul className="space-y-1.5">
          <li>7-day easy returns for unused items in original packaging</li>
          <li>
            Handcrafted items may have slight variations — this is a mark of
            authenticity
          </li>
          {meta.care && <li>Care: {meta.care}</li>}
        </ul>
      </AccordionItem>
    </div>
  );
}
