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
import { publishSingleFrameProductAction } from "@/app/admin/actions";

const ALL_FRAME_TYPES: FrameType[] = ["canvas", "acrylic", "wooden"];
const ALL_SIZES: FrameSize[] = ["8x12", "12x18", "18x24", "24x36"];

interface SizeRow {
  price: string;
  compareAtPrice: string;
  sku: string;
  stock: string;
  enabled: boolean;
}

function defaultSizes(): Record<FrameSize, SizeRow> {
  const rows: Partial<Record<FrameSize, SizeRow>> = {};
  ALL_SIZES.forEach((size, i) => {
    rows[size] = { price: "", compareAtPrice: "", sku: "", stock: "10", enabled: i < 2 };
  });
  return rows as Record<FrameSize, SizeRow>;
}

const inputCls =
  "w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export default function PublishWallArtPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [designName, setDesignName] = useState("");
  const [frameType, setFrameType] = useState<FrameType>("canvas");
  const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sizes, setSizes] = useState<Record<FrameSize, SizeRow>>(defaultSizes);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedId, setPublishedId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    createClient()
      .from("categories")
      .select("*")
      .order("display_order")
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  const autoFillSkus = () => {
    if (!designName) return;
    const code = designName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
    const abbr: Record<FrameType, string> = { canvas: "CV", acrylic: "AC", wooden: "WD" };
    setSizes((prev) => {
      const updated = { ...prev };
      ALL_SIZES.forEach((size) => {
        updated[size] = {
          ...updated[size],
          sku: `ALK-${code}-${abbr[frameType]}-${size.replace("x", "")}`,
        };
      });
      return updated;
    });
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setImages((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateSize = (size: FrameSize, field: keyof SizeRow, value: string | boolean) =>
    setSizes((prev) => ({ ...prev, [size]: { ...prev[size], [field]: value } }));

  const handlePublish = async () => {
    setError("");
    if (!designName.trim()) return setError("Enter a design name.");
    if (!categoryId) return setError("Select a category.");
    const enabledSizes = ALL_SIZES.filter((s) => sizes[s].enabled);
    if (!enabledSizes.length) return setError("Enable at least one size.");
    const missingPrice = enabledSizes.find((s) => !sizes[s].price);
    if (missingPrice) return setError(`Set a price for ${FRAME_SIZE_LABELS[missingPrice]}.`);

    setLoading(true);
    try {
      const supabase = createClient();
      const slug = generateSlug(`${designName} ${frameType}`);

      // Upload images via browser client (storage only)
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `products/${frameType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "31536000" });
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const variants = enabledSizes.map((size) => {
        const s = sizes[size];
        return {
          size,
          price: Math.round(parseFloat(s.price) * 100) || 0,
          compare_at_price: s.compareAtPrice ? Math.round(parseFloat(s.compareAtPrice) * 100) : null,
          sku: s.sku || null,
          stock_quantity: parseInt(s.stock) || 0,
          images: uploadedUrls,
        };
      });

      const id = await publishSingleFrameProductAction({
        name: `${designName} — ${FRAME_TYPE_LABELS[frameType]}`,
        slug,
        description: `${designName} — ${FRAME_TYPE_LABELS[frameType]} print. ${FRAME_TYPE_DESCRIPTIONS[frameType]}\n\nPrinted with archival-grade, fade-resistant inks. Hand-inspected and delivered in 5–7 days.`,
        category_id: categoryId,
        frame_type: frameType,
        is_featured: isFeatured,
        variants,
      });

      setPublishedId(id);
      setPublished(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Published!</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {designName} — {FRAME_TYPE_LABELS[frameType]} is now live.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/admin/products/${publishedId}`)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Edit &amp; Link to Group
          </button>
          <button
            onClick={() => {
              setPublished(false);
              setDesignName("");
              setImages([]);
              setImagePreviews([]);
              setSizes(defaultSizes());
              setError("");
            }}
            className="px-5 py-2.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-md transition-colors"
          >
            Publish Another Frame Type
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Publish Wall Art Product</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create one product per frame type. After publishing all frame types, use the product edit
          page to group them together so they appear as a single product on the storefront.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Step 1: Basic info */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs">1</span>
          Design &amp; Frame Type
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
            <p className="text-[10px] text-zinc-400 mt-1">
              Product name will be: <em>{designName ? `${designName} — ${FRAME_TYPE_LABELS[frameType]}` : "—"}</em>
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Frame type selector */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2">Frame Type *</label>
          <div className="grid grid-cols-3 gap-2">
            {ALL_FRAME_TYPES.map((ft) => (
              <button
                key={ft}
                type="button"
                onClick={() => { setFrameType(ft); autoFillSkus(); }}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-all",
                  frameType === ft
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <p className={cn("text-sm font-semibold", frameType === ft ? "text-indigo-700" : "text-zinc-800")}>
                  {FRAME_TYPE_LABELS[ft]}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">
                  {FRAME_TYPE_DESCRIPTIONS[ft]}
                </p>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          <span className="text-sm text-zinc-700">Feature on homepage</span>
        </label>
      </div>

      {/* Step 2: Gallery images */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs">2</span>
          Gallery Images
        </h2>
        <p className="text-xs text-zinc-500">Upload images for this frame type. These images are shared across all sizes.</p>
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((src, i) => (
            <div key={i} className="relative group w-16 h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover rounded-md" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <label className="w-16 h-20 border-2 border-dashed border-zinc-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors gap-1">
            <Plus className="w-4 h-4 text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Add</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
          </label>
        </div>
      </div>

      {/* Step 3: Size variants */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs">3</span>
          Size Variants &amp; Pricing
        </h2>

        <div className="grid grid-cols-[16px_80px_1fr_1fr_60px] gap-2 px-2 mb-1">
          <span />
          <p className="text-[10px] font-medium text-zinc-400 uppercase">Size</p>
          <p className="text-[10px] font-medium text-zinc-400 uppercase">Price (₹)</p>
          <p className="text-[10px] font-medium text-zinc-400 uppercase">SKU</p>
          <p className="text-[10px] font-medium text-zinc-400 uppercase text-center">Qty</p>
        </div>

        <div className="space-y-1.5">
          {ALL_SIZES.map((size) => {
            const s = sizes[size];
            return (
              <div
                key={size}
                className={cn(
                  "grid grid-cols-[16px_80px_1fr_1fr_60px] items-center gap-2 px-2 py-1.5 rounded-md",
                  s.enabled ? "bg-white border border-zinc-200" : "opacity-40"
                )}
              >
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => updateSize(size, "enabled", e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-indigo-600"
                />
                <span className="text-xs font-medium text-zinc-700">{FRAME_SIZE_LABELS[size]}</span>
                <input
                  value={s.price}
                  onChange={(e) => updateSize(size, "price", e.target.value)}
                  placeholder="0.00"
                  disabled={!s.enabled}
                  className={inputCls}
                />
                <input
                  value={s.sku}
                  onChange={(e) => updateSize(size, "sku", e.target.value)}
                  placeholder="ALK-XXXXX"
                  disabled={!s.enabled}
                  className={`${inputCls} font-mono text-xs`}
                />
                <input
                  value={s.stock}
                  onChange={(e) => updateSize(size, "stock", e.target.value)}
                  disabled={!s.enabled}
                  className={`${inputCls} text-center`}
                />
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-400 px-2">SKUs auto-fill on design name blur — edit as needed.</p>
      </div>

      {/* Publish */}
      <div className="bg-white border border-zinc-200 rounded-lg px-5 py-4 flex items-center gap-4">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? "Publishing…" : `Publish ${FRAME_TYPE_LABELS[frameType]} Product`}
        </button>
        <p className="text-xs text-zinc-400">
          Creates a standalone product for the {FRAME_TYPE_LABELS[frameType]} frame type.
        </p>
      </div>
    </div>
  );
}
