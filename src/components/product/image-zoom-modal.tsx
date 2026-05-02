"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageZoomModal({ src, alt, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 lg:p-12"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-2xl aspect-[3/4]"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-contain"
            priority
          />
        </motion.div>

        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/40 tracking-widest uppercase">
          Click anywhere to close · Esc
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

// Small hint overlay shown on image hover
export function ZoomHint() {
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
      <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
        <ZoomIn className="w-3.5 h-3.5 text-white" />
        <span className="text-[11px] text-white tracking-wide">Click to zoom</span>
      </div>
    </div>
  );
}
