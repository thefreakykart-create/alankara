"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { Loader2, Upload, Plus, Trash2, CheckCircle2 } from "lucide-react";
import type { Category, FrameType, FrameSize } from "@/lib/types/product";
import {
  FRAME_TYPE_LABELS,
  FRAME_SIZE_LABELS,
  FRAME_TYPE_DESCRIPTIONS,
} from "@/lib/types/product";
import { cn } from "@/lib/utils";
import { publishWallArtAction } from "@/app/admin/actions";

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

function defaultVariants(): Record<FrameSize, VariantRow> {
  const rows: Partial<Record<FrameSize, VariantRow>> = {};
  ALL_SIZES.forEach((size, i) => {
    rows[size] = {
      size,
      price: "",
      compareAtPrice: "",
      sku: "",
      stock: "10",
      enabled: i < 2,
    };
  });
  return rows as Record<FrameSize, VariantRow>;
}

function generateDescription(name: string, category: string, frameType: FrameType): string {
  const categoryMap: Record<string, string> = {
    devotional: `Bring divine blessings into your space with this ${name} art print.`,
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
  return `${intro}\n\n${FRAME_TYPE_DESCRIPTIONS[frameType]}\n\nPrinted with fade-resistant inks for lasting vibrancy. Perfect for living rooms, bedrooms, and gifting.`;
}

const inputCls =
  "w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export default function PublishWallArtPage() {
  const router = useRouter();

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
        variants: defaultVariants(),
      };
    });
    return config as Record<FrameType, FrameConfig>;
  });

  useEffect(() => {
    createClient()
      .from("categories")
      .select("*")
      .order("display_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const toggleFrame = (ft: FrameType) =>
    setFrames((prev) => ({
      ...prev,
      [ft]: { ...prev[ft], enabled: !prev[ft].enabled },
    }));

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
    setFrames((prev) => ({
      ...prev,
      [ft]: {
        ...prev[ft],
        images: prev[ft].images.filter((_, i) => i !== index),
        imagePreviews: prev[ft].imagePreviews.filter((_, i) => i !== index),
      },
    }));
  };

  const updateVariant = (
    ft: FrameType,
    size: FrameSize,
    field: keyof VariantRow,
    value: string | boolean
  ) =>
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

  const autoFillSkus = () => {
    if (!designName) return;
    const code = designName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
    const abbr: Record<FrameType, string> = { canvas: "CV", acrylic: "AC", wooden: "WD" };
    setFrames((prev) => {
      const updated = { ...prev };
      ALL_FRAME_TYPES.forEach((ft) => {
        ALL_SIZES.forEach((size) => {
          updated[ft] = {
            ...updated[ft],
            variants: {
              ...updated[ft].variants,
              [size]: {
                ...updated[ft].variants[size],
                sku: `ALK-${code}-${abbr[ft]}-${size.replace("x", "")}`,
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
      const supabase = createClient();
      const slug = generateSlug(designName);
      const selectedCategory = categories.find((c) => c.id === categoryId);

      // Upload images first using the browser client (storage only, no DB writes)
      const frameImageUrls: Record<FrameType, string[]> = {} as Record<FrameType, string[]>;
      for (const ft of enabledFrames) {
        const uploadedUrls: string[] = [];
        for (const file of frames[ft].images) {
          const ext = file.name.split(".").pop();
          const path = `products/tmp/${ft}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(path, file, { cacheControl: "31536000" });
          if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
        frameImageUrls[ft] = uploadedUrls;
      }

      // Build variant payloads
      const variants = enabledFrames.flatMap((ft) => {
        const enabledSizes = ALL_SIZES.filter((s) => frames[ft].variants[s].enabled);
        return enabledSizes.map((size) => {
          const v = frames[ft].variants[size];
          return {
            frame_type: ft,
            size,
            price: Math.round(parseFloat(v.price) * 100) || 0,
            compare_at_price: v.compareAtPrice
              ? Math.round(parseFloat(v.compareAtPrice) * 100)
              : null,
            sku: v.sku || null,
            stock_quantity: parseInt(v.stock) || 0,
            images: frameImageUrls[ft],
          };
        });
      });

      // Use server action (admin service role) to create product + variants
      await publishWallArtAction({
        name: designName,
        slug,
        description: generateDescription(designName, selectedCategory?.slug ?? "", enabledFrames[0]),
        category_id: categoryId,
        is_featured: isFeatured,
        variants,
      });

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">Published!</h2>
        <p className="text-sm text-zinc-500">Redirecting to product page…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Publish Wall Art</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload a design once and configure every frame and size combination from one screen.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Design info */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs mr-2">1</span>
          Design Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Design Name *</label>
            <input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              onBlur={autoFillSkus}
              placeholder="e.g. Lord Ganesh"
              className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2.5 mt-3 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          <span className="text-sm text-zinc-700">Feature on homepage</span>
        </label>
      </div>

      {/* Frame types */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs mr-2">2</span>
          Frame Types & Variants
        </h2>

        {ALL_FRAME_TYPES.map((ft) => (
          <div
            key={ft}
            className={cn(
              "border rounded-lg transition-all",
              frames[ft].enabled
                ? "border-indigo-300 bg-indigo-50/30"
                : "border-zinc-200 opacity-60"
            )}
          >
            {/* Frame header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={frames[ft].enabled}
                onChange={() => toggleFrame(ft)}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">{FRAME_TYPE_LABELS[ft]}</p>
                <p className="text-xs text-zinc-500">{FRAME_TYPE_DESCRIPTIONS[ft]}</p>
              </div>
            </div>

            {frames[ft].enabled && (
              <div className="px-4 pb-4 space-y-4 border-t border-zinc-200">
                {/* Images */}
                <div className="pt-3">
                  <p className="text-xs font-medium text-zinc-500 mb-2">Gallery Images</p>
                  <div className="flex flex-wrap gap-2">
                    {frames[ft].imagePreviews.map((src, i) => (
                      <div key={i} className="relative group w-16 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover rounded-md" />
                        <button
                          onClick={() => removeImage(ft, i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <label className="w-16 h-20 border-2 border-dashed border-zinc-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors gap-1">
                      <Plus className="w-4 h-4 text-zinc-400" />
                      <span className="text-[10px] text-zinc-400">Add</span>
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

                {/* Variant rows */}
                <div>
                  <div className="grid grid-cols-[16px_80px_1fr_1fr_60px] gap-2 px-2 mb-1">
                    <span />
                    <p className="text-[10px] font-medium text-zinc-400 uppercase">Size</p>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase">Price (₹)</p>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase">SKU</p>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase text-center">Qty</p>
                  </div>
                  <div className="space-y-1.5">
                    {ALL_SIZES.map((size) => {
                      const v = frames[ft].variants[size];
                      return (
                        <div
                          key={size}
                          className={cn(
                            "grid grid-cols-[16px_80px_1fr_1fr_60px] items-center gap-2 px-2 py-1.5 rounded-md",
                            v.enabled ? "bg-white border border-zinc-200" : "opacity-40"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={v.enabled}
                            onChange={(e) => updateVariant(ft, size, "enabled", e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-indigo-600"
                          />
                          <span className="text-xs font-medium text-zinc-700">
                            {FRAME_SIZE_LABELS[size]}
                          </span>
                          <input
                            value={v.price}
                            onChange={(e) => updateVariant(ft, size, "price", e.target.value)}
                            placeholder="0.00"
                            disabled={!v.enabled}
                            className={inputCls}
                          />
                          <input
                            value={v.sku}
                            onChange={(e) => updateVariant(ft, size, "sku", e.target.value)}
                            placeholder="ALK-XXXXX"
                            disabled={!v.enabled}
                            className={`${inputCls} font-mono text-xs`}
                          />
                          <input
                            value={v.stock}
                            onChange={(e) => updateVariant(ft, size, "stock", e.target.value)}
                            disabled={!v.enabled}
                            className={`${inputCls} text-center`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1.5 px-2">
                    SKUs auto-filled on name blur — edit as needed.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Publish bar */}
      <div className="bg-white border border-zinc-200 rounded-lg px-5 py-4 flex items-center gap-4">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {loading ? "Publishing…" : "Publish All Variants"}
        </button>
        <p className="text-xs text-zinc-400">
          Creates the product and all selected variants instantly.
        </p>
      </div>
    </div>
  );
}
