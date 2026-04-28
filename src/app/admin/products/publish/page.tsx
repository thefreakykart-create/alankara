"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import {
  Loader2, Upload, Plus, Trash2, CheckCircle2,
  ImageIcon, X, ChevronRight,
} from "lucide-react";
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
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

export default function PublishWallArtPage() {
  const router = useRouter();

  // ── Meta ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [designName, setDesignName] = useState("");
  const [frameType, setFrameType] = useState<FrameType>("canvas");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // ── Featured image ──
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState<string>("");
  const featuredInputRef = useRef<HTMLInputElement>(null);

  // ── Gallery images ──
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // ── Sizes ──
  const [sizes, setSizes] = useState<Record<FrameSize, SizeRow>>(defaultSizes);

  // ── UI ──
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

  // Auto-generate description when design name or frame type changes
  useEffect(() => {
    if (!designName) return;
    setDescription(
      `${designName} — ${FRAME_TYPE_LABELS[frameType]} print. ${FRAME_TYPE_DESCRIPTIONS[frameType]}\n\nPrinted with archival-grade, fade-resistant inks. Hand-inspected and delivered to your door in 5–7 business days.`
    );
  }, [designName, frameType]);

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

  const handleFeaturedUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setFeaturedFile(file);
    setFeaturedPreview(URL.createObjectURL(file));
  };

  const handleGalleryUpload = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setGalleryFiles((p) => [...p, ...arr]);
    setGalleryPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeGallery = (i: number) => {
    setGalleryFiles((p) => p.filter((_, idx) => idx !== i));
    setGalleryPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const updateSize = (size: FrameSize, field: keyof SizeRow, value: string | boolean) =>
    setSizes((prev) => ({ ...prev, [size]: { ...prev[size], [field]: value } }));

  const uploadFile = async (file: File, path: string) => {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "31536000" });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  };

  const handlePublish = async () => {
    setError("");
    if (!designName.trim()) return setError("Enter a design name.");
    if (!categoryId) return setError("Select a category.");
    if (!featuredFile) return setError("Upload a featured image.");
    const enabledSizes = ALL_SIZES.filter((s) => sizes[s].enabled);
    if (!enabledSizes.length) return setError("Enable at least one size.");
    const missingPrice = enabledSizes.find((s) => !sizes[s].price);
    if (missingPrice) return setError(`Set a price for ${FRAME_SIZE_LABELS[missingPrice]}.`);

    setLoading(true);
    try {
      const slug = generateSlug(`${designName} ${frameType}`);
      const ts = Date.now();

      // 1. Upload featured image
      const featuredUrl = await uploadFile(
        featuredFile,
        `products/${frameType}/featured-${ts}.${featuredFile.name.split(".").pop()}`
      );

      // 2. Upload gallery images
      const galleryUrls: string[] = [];
      for (const file of galleryFiles) {
        const url = await uploadFile(
          file,
          `products/${frameType}/gallery-${ts}-${Math.random().toString(36).slice(2)}.${file.name.split(".").pop()}`
        );
        galleryUrls.push(url);
      }

      // Gallery for variants: featured + gallery combined
      const variantImages = [featuredUrl, ...galleryUrls];

      const variants = enabledSizes.map((size) => {
        const s = sizes[size];
        return {
          size,
          price: Math.round(parseFloat(s.price) * 100) || 0,
          compare_at_price: s.compareAtPrice ? Math.round(parseFloat(s.compareAtPrice) * 100) : null,
          sku: s.sku || null,
          stock_quantity: parseInt(s.stock) || 0,
          images: variantImages,
        };
      });

      const id = await publishSingleFrameProductAction({
        name: `${designName} — ${FRAME_TYPE_LABELS[frameType]}`,
        slug,
        description: description || `${designName} — ${FRAME_TYPE_LABELS[frameType]} print.`,
        category_id: categoryId,
        frame_type: frameType,
        is_featured: isFeatured,
        product_images: [featuredUrl],
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

  const resetForm = () => {
    setPublished(false);
    setDesignName("");
    setDescription("");
    setTags("");
    setFeaturedFile(null);
    setFeaturedPreview("");
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setSizes(defaultSizes());
    setError("");
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
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => router.push(`/admin/products/${publishedId}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Edit &amp; Link to Group <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={resetForm}
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
          One product per frame type. After publishing, group them on the edit page so they appear as a single product on the storefront.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md flex items-start gap-2">
          <span className="mt-0.5">⚠</span> {error}
        </div>
      )}

      {/* ── Step 1: Design Info ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <SectionTitle step={1} title="Design & Frame Type" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Design Name *</label>
            <input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              onBlur={autoFillSkus}
              placeholder="e.g. Lord Ganesh"
              className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Product will be named: <em className="text-zinc-600">{designName ? `${designName} — ${FRAME_TYPE_LABELS[frameType]}` : "—"}</em>
            </p>
          </div>
          <div>
            <label className={labelCls}>Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Tags <span className="text-zinc-400 font-normal">(comma-separated)</span></label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="devotional, ganesh, gold, canvas"
              className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Frame type */}
        <div>
          <label className={labelCls}>Frame Type *</label>
          <div className="grid grid-cols-3 gap-2">
            {ALL_FRAME_TYPES.map((ft) => (
              <button
                key={ft}
                type="button"
                onClick={() => setFrameType(ft)}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-all",
                  frameType === ft ? "border-indigo-500 bg-indigo-50" : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <p className={cn("text-sm font-semibold", frameType === ft ? "text-indigo-700" : "text-zinc-800")}>
                  {FRAME_TYPE_LABELS[ft]}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{FRAME_TYPE_DESCRIPTIONS[ft]}</p>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
          <span className="text-sm text-zinc-700">Feature on homepage</span>
        </label>
      </div>

      {/* ── Step 2: Featured Image ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <SectionTitle step={2} title="Featured Image" />
        <p className="text-xs text-zinc-500 -mt-2">
          The primary image shown on product cards, search results, and as the cover photo.
        </p>

        <div className="flex gap-6 items-start">
          {/* Upload area / preview */}
          {featuredPreview ? (
            <div className="relative flex-none w-44 h-56 rounded-xl overflow-hidden border border-zinc-200 shadow-sm group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredPreview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => { setFeaturedFile(null); setFeaturedPreview(""); }}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-red-50 text-zinc-700 hover:text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                <button
                  type="button"
                  onClick={() => featuredInputRef.current?.click()}
                  className="text-[10px] text-white/80 hover:text-white transition-colors"
                >
                  Click to replace
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => featuredInputRef.current?.click()}
              className="flex-none w-44 h-56 rounded-xl border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-zinc-600">Upload featured image</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG, WebP</p>
              </div>
            </button>
          )}
          <input
            ref={featuredInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFeaturedUpload(e.target.files)}
          />

          <div className="flex-1 space-y-2.5 pt-1">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-none mt-0.5">
                <span className="text-[10px] text-emerald-700 font-bold">✓</span>
              </div>
              <p className="text-xs text-zinc-600">Shows on product cards throughout the site</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-none mt-0.5">
                <span className="text-[10px] text-emerald-700 font-bold">✓</span>
              </div>
              <p className="text-xs text-zinc-600">Used for social sharing previews</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center flex-none mt-0.5">
                <span className="text-[10px] text-zinc-400">i</span>
              </div>
              <p className="text-xs text-zinc-400">Recommended: 3:4 ratio (e.g. 900×1200px)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Step 3: Gallery Images ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <SectionTitle step={3} title="Gallery Images" />
        <p className="text-xs text-zinc-500 -mt-2">
          Additional images shown in the product page gallery. The featured image is automatically included as the first gallery image.
        </p>

        <div className="flex flex-wrap gap-3">
          {galleryPreviews.map((src, i) => (
            <div key={i} className="relative group flex-none w-24 h-32 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => removeGallery(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 hover:bg-red-50 text-zinc-700 hover:text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                <span className="text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                  {i + 1}
                </span>
              </div>
            </div>
          ))}

          <label className="flex-none w-24 h-32 rounded-lg border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer">
            <Plus className="w-5 h-5 text-zinc-400" />
            <span className="text-[10px] text-zinc-400 text-center px-2">Add images</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleGalleryUpload(e.target.files)} />
          </label>
        </div>

        {galleryFiles.length > 0 && (
          <p className="text-xs text-zinc-500">{galleryFiles.length} image{galleryFiles.length > 1 ? "s" : ""} selected — will upload on publish</p>
        )}
      </div>

      {/* ── Step 4: Description ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
        <SectionTitle step={4} title="Description" />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe this artwork…"
          className="w-full px-3 py-2.5 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
        />
        <p className="text-[10px] text-zinc-400">Auto-filled from the design name — edit freely.</p>
      </div>

      {/* ── Step 5: Size Variants ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
        <SectionTitle step={5} title="Size Variants & Pricing" />

        <div className="grid grid-cols-[16px_80px_1fr_1fr_1fr_60px] gap-2 px-2 mb-1">
          <span />
          <p className="text-[10px] font-medium text-zinc-400 uppercase">Size</p>
          <p className="text-[10px] font-medium text-zinc-400 uppercase">Price (₹) *</p>
          <p className="text-[10px] font-medium text-zinc-400 uppercase">Compare (₹)</p>
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
                  "grid grid-cols-[16px_80px_1fr_1fr_1fr_60px] items-center gap-2 px-2 py-1.5 rounded-md transition-all",
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
                  value={s.compareAtPrice}
                  onChange={(e) => updateSize(size, "compareAtPrice", e.target.value)}
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
        <p className="text-[10px] text-zinc-400 px-2">SKUs auto-fill on design name blur — edit freely.</p>
      </div>

      {/* ── Publish bar ── */}
      <div className="bg-white border border-zinc-200 rounded-lg px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-900">Ready to publish?</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Creates a standalone {FRAME_TYPE_LABELS[frameType]} product. Link it to other frame types after publishing.
          </p>
        </div>
        <button
          onClick={handlePublish}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 whitespace-nowrap flex-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? "Publishing…" : `Publish ${FRAME_TYPE_LABELS[frameType]}`}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex-none">
        {step}
      </span>
      {title}
    </h2>
  );
}
