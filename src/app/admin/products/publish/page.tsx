"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { Loader2, Upload, Plus, Trash2, CheckCircle } from "lucide-react";
import type { Category, FrameType, FrameSize } from "@/lib/types/product";
import { FRAME_TYPE_LABELS, FRAME_SIZE_LABELS, FRAME_TYPE_DESCRIPTIONS } from "@/lib/types/product";
import { cn } from "@/lib/utils";

const ALL_FRAME_TYPES: FrameType[] = ["canvas", "acrylic", "wooden"];
const ALL_SIZES: FrameSize[] = ["8x12", "12x18", "18x24", "24x36"];

interface VariantRow {
  size: FrameSize;
  price: string;
  compareAtPrice: string;
  sku: string;
  stock: string;
  enabled: boolean;
}

interface FrameConfig {
  enabled: boolean;
  images: File[];
  imagePreviews: string[];
  variants: Record<FrameSize, VariantRow>;
}

function defaultVariants(frameType: FrameType): Record<FrameSize, VariantRow> {
  const rows: Partial<Record<FrameSize, VariantRow>> = {};
  ALL_SIZES.forEach((size, i) => {
    rows[size] = {
      size,
      price: "",
      compareAtPrice: "",
      sku: "",
      stock: "10",
      enabled: i < 2, // default first 2 sizes enabled
    };
  });
  return rows as Record<FrameSize, VariantRow>;
}

function generateDescription(name: string, category: string, frameType: FrameType): string {
  const categoryMap: Record<string, string> = {
    "devotional": `Bring divine blessings into your space with this ${name} art print.`,
    "motivational-quotes": `Let this powerful quote inspire you every day — ${name}.`,
    "nature-landscapes": `Bring the serenity of nature indoors with this ${name} print.`,
    "abstract-art": `A bold statement piece — ${name} in striking abstract form.`,
    "botanical-floral": `Fresh, organic beauty — ${name} brings life to any wall.`,
    "family-home": `Celebrate what matters most with this ${name} wall art.`,
    "couple-love": `A heartfelt piece — ${name}, perfect for gifting or your own space.`,
    "kids-room": `Bright, playful, and full of wonder — ${name} for little dreamers.`,
    "heritage-architecture": `A tribute to India's timeless beauty — ${name}.`,
    "combo-sets": `A curated set — ${name}, designed to complement each other perfectly.`,
  };
  const intro = categoryMap[category] || `${name} — a beautiful addition to any home.`;
  const frameDesc = FRAME_TYPE_DESCRIPTIONS[frameType];
  return `${intro}\n\n${frameDesc}\n\nPrinted with fade-resistant inks for lasting vibrancy. Perfect for living rooms, bedrooms, and gifting.`;
}

export default function PublishWallArtPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [designName, setDesignName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");

  const [frames, setFrames] = useState<Record<FrameType, FrameConfig>>(() => {
    const config: Partial<Record<FrameType, FrameConfig>> = {};
    ALL_FRAME_TYPES.forEach((ft) => {
      config[ft] = {
        enabled: ft === "canvas",
        images: [],
        imagePreviews: [],
        variants: defaultVariants(ft),
      };
    });
    return config as Record<FrameType, FrameConfig>;
  });

  useEffect(() => {
    supabase.from("categories").select("*").order("display_order").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const toggleFrame = (ft: FrameType) => {
    setFrames((prev) => ({
      ...prev,
      [ft]: { ...prev[ft], enabled: !prev[ft].enabled },
    }));
  };

  const handleImageUpload = (ft: FrameType, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setFrames((prev) => ({
      ...prev,
      [ft]: {
        ...prev[ft],
        images: [...prev[ft].images, ...newFiles],
        imagePreviews: [...prev[ft].imagePreviews, ...previews],
      },
    }));
  };

  const removeImage = (ft: FrameType, index: number) => {
    setFrames((prev) => {
      const images = prev[ft].images.filter((_, i) => i !== index);
      const imagePreviews = prev[ft].imagePreviews.filter((_, i) => i !== index);
      return { ...prev, [ft]: { ...prev[ft], images, imagePreviews } };
    });
  };

  const updateVariant = (ft: FrameType, size: FrameSize, field: keyof VariantRow, value: string | boolean) => {
    setFrames((prev) => ({
      ...prev,
      [ft]: {
        ...prev[ft],
        variants: {
          ...prev[ft].variants,
          [size]: { ...prev[ft].variants[size], [field]: value },
        },
      },
    }));
  };

  // Auto-fill SKUs when name changes
  const autoFillSkus = () => {
    if (!designName) return;
    const code = designName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
    const frameAbbrMap: Record<FrameType, string> = { canvas: "CV", acrylic: "AC", wooden: "WD" };
    setFrames((prev) => {
      const updated = { ...prev };
      ALL_FRAME_TYPES.forEach((ft) => {
        const abbr = frameAbbrMap[ft];
        ALL_SIZES.forEach((size) => {
          const sizeCode = size.replace("x", "");
          updated[ft] = {
            ...updated[ft],
            variants: {
              ...updated[ft].variants,
              [size]: {
                ...updated[ft].variants[size],
                sku: `ALK-${code}-${abbr}-${sizeCode}`,
              },
            },
          };
        });
      });
      return updated;
    });
  };

  const handlePublish = async () => {
    setError("");
    if (!designName.trim()) return setError("Enter a design name.");
    if (!categoryId) return setError("Select a category.");
    const enabledFrames = ALL_FRAME_TYPES.filter((ft) => frames[ft].enabled);
    if (enabledFrames.length === 0) return setError("Enable at least one frame type.");

    setLoading(true);
    try {
      const slug = generateSlug(designName);
      const selectedCategory = categories.find((c) => c.id === categoryId);

      // Create the product
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: designName,
          slug,
          description: generateDescription(designName, selectedCategory?.slug ?? "", enabledFrames[0]),
          product_type: "wall_art",
          price: 0, // wall_art uses variants for pricing
          category_id: categoryId,
          images: [],
          stock_quantity: 0,
          is_active: true,
          is_featured: isFeatured,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Upload images + create variants for each enabled frame type
      for (const ft of enabledFrames) {
        const frameConfig = frames[ft];
        const uploadedUrls: string[] = [];

        // Upload images to Supabase Storage
        for (const file of frameConfig.images) {
          const ext = file.name.split(".").pop();
          const path = `products/${product.id}/${ft}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(path, file, { cacheControl: "31536000" });
          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("product-images")
              .getPublicUrl(path);
            uploadedUrls.push(urlData.publicUrl);
          }
        }

        // Create variants for each enabled size
        const enabledSizes = ALL_SIZES.filter((s) => frameConfig.variants[s].enabled);
        for (const size of enabledSizes) {
          const v = frameConfig.variants[size];
          const priceNum = Math.round(parseFloat(v.price) * 100);
          const comparePriceNum = v.compareAtPrice ? Math.round(parseFloat(v.compareAtPrice) * 100) : null;

          await supabase.from("product_variants").insert({
            product_id: product.id,
            frame_type: ft,
            size,
            price: priceNum,
            compare_at_price: comparePriceNum,
            sku: v.sku || null,
            stock_quantity: parseInt(v.stock) || 0,
            images: uploadedUrls,
            is_active: true,
          });
        }
      }

      setPublished(true);
      setTimeout(() => router.push(`/products/${slug}`), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle className="w-14 h-14 text-emerald" />
        <h2 className="font-serif text-2xl text-charcoal">Published!</h2>
        <p className="text-muted text-sm">Redirecting to product page…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="font-serif text-2xl text-charcoal">Publish Wall Art</h1>
        <p className="text-muted text-sm mt-1">Upload designs and configure frame variants in one step.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm">
          {error}
        </div>
      )}

      {/* Step 1: Design Info */}
      <section className="space-y-4">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted border-b border-border pb-2">
          1 — Design Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted tracking-wide block mb-1.5">Design Name *</label>
            <input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              onBlur={autoFillSkus}
              placeholder="e.g. Lord Ganesh"
              className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
            />
          </div>
          <div>
            <label className="text-xs text-muted tracking-wide block mb-1.5">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-border rounded-sm px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal bg-white"
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="accent-terracotta w-4 h-4"
          />
          Feature on home page
        </label>
      </section>

      {/* Step 2: Frame Types */}
      <section className="space-y-6">
        <h2 className="text-xs tracking-[0.2em] uppercase text-muted border-b border-border pb-2">
          2 — Frame Types & Variants
        </h2>

        {ALL_FRAME_TYPES.map((ft) => (
          <div
            key={ft}
            className={cn(
              "border rounded-sm transition-all",
              frames[ft].enabled ? "border-charcoal" : "border-border opacity-60"
            )}
          >
            {/* Frame header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={frames[ft].enabled}
                  onChange={() => toggleFrame(ft)}
                  className="accent-charcoal w-4 h-4"
                />
                <div>
                  <p className="text-sm font-medium text-charcoal">{FRAME_TYPE_LABELS[ft]}</p>
                  <p className="text-xs text-muted">{FRAME_TYPE_DESCRIPTIONS[ft]}</p>
                </div>
              </div>
            </div>

            {frames[ft].enabled && (
              <div className="px-5 pb-5 space-y-5 border-t border-border">

                {/* Image upload */}
                <div className="pt-4">
                  <p className="text-xs text-muted tracking-wide mb-3">Gallery Images</p>
                  <div className="flex flex-wrap gap-3">
                    {frames[ft].imagePreviews.map((src, i) => (
                      <div key={i} className="relative group w-20 h-24">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover rounded-sm" />
                        <button
                          onClick={() => removeImage(ft, i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <label className="w-20 h-24 border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-charcoal transition-colors gap-1">
                      <Plus className="w-4 h-4 text-muted" />
                      <span className="text-[10px] text-muted">Add</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(ft, e.target.files)}
                      />
                    </label>
                  </div>
                </div>

                {/* Variant pricing table */}
                <div>
                  <p className="text-xs text-muted tracking-wide mb-3">Sizes & Pricing</p>
                  <div className="space-y-2">
                    {ALL_SIZES.map((size) => {
                      const v = frames[ft].variants[size];
                      return (
                        <div key={size} className={cn(
                          "grid grid-cols-[auto_1fr_1fr_1.5fr_auto] items-center gap-3 py-2 px-3 rounded-sm",
                          v.enabled ? "bg-cream" : "opacity-40"
                        )}>
                          <input
                            type="checkbox"
                            checked={v.enabled}
                            onChange={(e) => updateVariant(ft, size, "enabled", e.target.checked)}
                            className="accent-charcoal w-3.5 h-3.5"
                          />
                          <span className="text-xs font-medium text-charcoal w-16">
                            {FRAME_SIZE_LABELS[size]}
                          </span>
                          <input
                            value={v.price}
                            onChange={(e) => updateVariant(ft, size, "price", e.target.value)}
                            placeholder="₹ Price"
                            disabled={!v.enabled}
                            className="border border-border rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-charcoal disabled:bg-gray-50 w-full"
                          />
                          <input
                            value={v.sku}
                            onChange={(e) => updateVariant(ft, size, "sku", e.target.value)}
                            placeholder="SKU"
                            disabled={!v.enabled}
                            className="border border-border rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-charcoal disabled:bg-gray-50 w-full font-mono"
                          />
                          <input
                            value={v.stock}
                            onChange={(e) => updateVariant(ft, size, "stock", e.target.value)}
                            placeholder="Qty"
                            disabled={!v.enabled}
                            className="border border-border rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-charcoal disabled:bg-gray-50 w-14 text-center"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted mt-2">SKUs auto-filled from design name — edit as needed.</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Publish */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-charcoal text-warm-white text-sm tracking-[0.12em] uppercase hover:bg-terracotta transition-colors rounded-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? "Publishing…" : "Publish All Variants"}
        </button>
        <p className="text-xs text-muted">
          This will create the product and all selected variants instantly.
        </p>
      </div>
    </div>
  );
}
