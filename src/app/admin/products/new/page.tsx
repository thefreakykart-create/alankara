"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import {
  Loader2, CheckCircle2, ImageIcon, X, Plus, ChevronRight,
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
  "w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

export default function NewProductPage() {
  const router = useRouter();

  // ── Type ──
  const [productType, setProductType] = useState<"wall_art" | "general">("wall_art");

  // ── Common fields ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [sku, setSku] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [weightGrams, setWeightGrams] = useState("");
  const [material, setMaterial] = useState("");
  const [care, setCare] = useState("");

  // ── Wall art ──
  const [frameType, setFrameType] = useState<FrameType>("canvas");
  const [sizes, setSizes] = useState<Record<FrameSize, SizeRow>>(defaultSizes);

  // ── General product ──
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stock, setStock] = useState("0");

  // ── Images ──
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const featuredRef = useRef<HTMLInputElement>(null);

  // ── UI ──
  const [loading, setLoading] = useState(false);
  const [doneId, setDoneId] = useState("");
  const [doneSlug, setDoneSlug] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    createClient().from("categories").select("*").order("display_order")
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

  // Auto-fill description for wall art
  useEffect(() => {
    if (productType !== "wall_art" || !name) return;
    setDescription(
      `${name} — ${FRAME_TYPE_LABELS[frameType]} print. ${FRAME_TYPE_DESCRIPTIONS[frameType]}\n\nPrinted with archival-grade, fade-resistant inks. Hand-inspected and delivered in 5–7 business days.`
    );
  }, [name, frameType, productType]);

  const autoFillSkus = () => {
    if (!name || productType !== "wall_art") return;
    const code = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
    const abbr: Record<FrameType, string> = { canvas: "CV", acrylic: "AC", wooden: "WD" };
    setSizes((prev) => {
      const next = { ...prev };
      ALL_SIZES.forEach((s) => {
        next[s] = { ...next[s], sku: `ALK-${code}-${abbr[frameType]}-${s.replace("x", "")}` };
      });
      return next;
    });
  };

  const uploadFile = async (file: File, path: string) => {
    const supabase = createClient();
    const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "31536000" });
    if (error) throw new Error(error.message);
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) return setError("Product name is required.");
    if (!categoryId) return setError("Select a category.");
    if (!featuredFile) return setError("Upload a featured image.");

    if (productType === "wall_art") {
      const enabled = ALL_SIZES.filter((s) => sizes[s].enabled);
      if (!enabled.length) return setError("Enable at least one size.");
      const missing = enabled.find((s) => !sizes[s].price);
      if (missing) return setError(`Set a price for ${FRAME_SIZE_LABELS[missing]}.`);
    } else {
      if (!price) return setError("Price is required.");
    }

    setLoading(true);
    try {
      const ts = Date.now();
      const folder = productType === "wall_art" ? frameType : "general";

      // Upload featured image
      const featuredUrl = await uploadFile(
        featuredFile,
        `products/${folder}/featured-${ts}.${featuredFile.name.split(".").pop()}`
      );

      // Upload gallery images
      const galleryUrls: string[] = [];
      for (const file of galleryFiles) {
        const url = await uploadFile(
          file,
          `products/${folder}/gallery-${ts}-${Math.random().toString(36).slice(2)}.${file.name.split(".").pop()}`
        );
        galleryUrls.push(url);
      }

      const allImages = [featuredUrl, ...galleryUrls];

      if (productType === "wall_art") {
        const slug = generateSlug(`${name} ${frameType}`);
        const enabled = ALL_SIZES.filter((s) => sizes[s].enabled);
        const variants = enabled.map((size) => ({
          size,
          price: Math.round(parseFloat(sizes[size].price) * 100) || 0,
          compare_at_price: sizes[size].compareAtPrice ? Math.round(parseFloat(sizes[size].compareAtPrice) * 100) : null,
          sku: sizes[size].sku || null,
          stock_quantity: parseInt(sizes[size].stock) || 0,
          images: allImages,
        }));

        const id = await publishSingleFrameProductAction({
          name: `${name} — ${FRAME_TYPE_LABELS[frameType]}`,
          slug,
          description,
          category_id: categoryId,
          frame_type: frameType,
          is_featured: isFeatured,
          product_images: [featuredUrl],
          variants,
        });

        setDoneId(id);
        setDoneSlug(slug);
      } else {
        const supabase = createClient();
        const slug = generateSlug(name);
        const metadata: Record<string, string> = {};
        if (material) metadata.material = material;
        if (care) metadata.care = care;
        if (tags) metadata.tags = tags;

        const { data, error: insertErr } = await supabase.from("products").insert({
          name,
          slug,
          description: description || null,
          product_type: "general",
          price: Math.round(parseFloat(price) * 100),
          compare_at_price: compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : null,
          category_id: categoryId,
          images: allImages,
          sku: sku || null,
          stock_quantity: parseInt(stock) || 0,
          is_featured: isFeatured,
          weight_grams: weightGrams ? parseInt(weightGrams) : null,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
        }).select("id").single();

        if (insertErr) throw new Error(insertErr.message);
        setDoneId(data.id);
        setDoneSlug(slug);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (doneId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Product Created!</h2>
          <p className="text-sm text-zinc-500 mt-1">{name} is now live.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => router.push(`/admin/products/${doneId}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Edit Product <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push("/admin/products/new")}
            className="px-5 py-2.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-md transition-colors"
          >
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Add Product</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create a wall art product (with frame type &amp; size variants) or a general catalog product.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* ── Product type toggle ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-1.5 flex gap-1">
        {[
          { value: "wall_art", label: "Wall Art", desc: "Frame types + size variants" },
          { value: "general", label: "General Product", desc: "Single price + stock" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setProductType(opt.value as "wall_art" | "general")}
            className={cn(
              "flex-1 px-4 py-3 rounded-md text-left transition-all",
              productType === opt.value
                ? "bg-indigo-600 shadow-sm"
                : "hover:bg-zinc-50"
            )}
          >
            <p className={cn("text-sm font-semibold", productType === opt.value ? "text-white" : "text-zinc-800")}>
              {opt.label}
            </p>
            <p className={cn("text-xs mt-0.5", productType === opt.value ? "text-indigo-200" : "text-zinc-400")}>
              {opt.desc}
            </p>
          </button>
        ))}
      </div>

      {/* ── Basic Info ── */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={productType === "wall_art" ? "" : "md:col-span-2"}>
            <label className={labelCls}>
              {productType === "wall_art" ? "Design Name *" : "Product Name *"}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={autoFillSkus}
              placeholder={productType === "wall_art" ? "e.g. Lord Ganesh" : "e.g. Brass Diya"}
              className={inputCls}
            />
            {productType === "wall_art" && (
              <p className="text-[10px] text-zinc-400 mt-1">
                Will be saved as: <em className="text-zinc-600">{name ? `${name} — ${FRAME_TYPE_LABELS[frameType]}` : "—"}</em>
              </p>
            )}
          </div>

          {productType === "wall_art" && (
            <div>
              <label className={labelCls}>Frame Type *</label>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_FRAME_TYPES.map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => setFrameType(ft)}
                    className={cn(
                      "p-2 rounded-md border-2 text-left transition-all",
                      frameType === ft ? "border-indigo-500 bg-indigo-50" : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <p className={cn("text-xs font-semibold", frameType === ft ? "text-indigo-700" : "text-zinc-700")}>
                      {FRAME_TYPE_LABELS[ft]}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Category *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {productType === "general" && (
            <div>
              <label className={labelCls}>SKU</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="ALK-XXXXX" className={`${inputCls} font-mono`} />
            </div>
          )}

          <div className="md:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe this product…"
              className="w-full px-3 py-2.5 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Tags <span className="font-normal text-zinc-400">(comma-separated)</span></label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="devotional, gold, festive" className={inputCls} />
          </div>
        </div>

        {/* General product pricing */}
        {productType === "general" && (
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-100">
            <div>
              <label className={labelCls}>Price (₹) *</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Compare At (₹)</label>
              <input type="number" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stock</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}

        {/* Physical */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-100">
          <div>
            <label className={labelCls}>Weight (g)</label>
            <input type="number" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Material</label>
            <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. Canvas" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Care</label>
            <input value={care} onChange={(e) => setCare(e.target.value)} placeholder="e.g. Dry cloth" className={inputCls} />
          </div>
        </div>

        <label className="inline-flex items-center gap-2.5 cursor-pointer pt-1">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
          <span className="text-sm text-zinc-700">Feature on homepage</span>
        </label>
      </section>

      {/* ── Featured Image ── */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Featured Image <span className="text-red-500">*</span></h2>
          <p className="text-xs text-zinc-500 mt-0.5">Primary image shown on product cards and search results.</p>
        </div>

        <div className="flex gap-6 items-start">
          {featuredPreview ? (
            <div className="relative flex-none w-44 h-56 rounded-xl overflow-hidden border border-zinc-200 shadow-sm group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredPreview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => { setFeaturedFile(null); setFeaturedPreview(""); }}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-red-50 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                type="button"
                onClick={() => featuredRef.current?.click()}
                className="absolute bottom-0 inset-x-0 bg-black/40 py-2 text-[10px] text-white/80 hover:text-white transition-colors text-center opacity-0 group-hover:opacity-100"
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => featuredRef.current?.click()}
              className="flex-none w-44 h-56 rounded-xl border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="text-center px-3">
                <p className="text-xs font-medium text-zinc-600">Click to upload</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">3:4 ratio recommended</p>
              </div>
            </button>
          )}
          <input
            ref={featuredRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setFeaturedFile(f); setFeaturedPreview(URL.createObjectURL(f)); }
            }}
          />

          <div className="space-y-2 pt-1 text-xs text-zinc-500">
            <p className="font-medium text-zinc-700">Tips</p>
            <p>→ 3:4 ratio (e.g. 900×1200 px)</p>
            <p>→ JPG or WebP</p>
            <p>→ Under 5 MB</p>
            <p>→ Well-lit, clean background</p>
          </div>
        </div>
      </section>

      {/* ── Gallery Images ── */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Gallery Images</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Additional images shown in the product page slideshow. Featured image is included automatically.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {galleryPreviews.map((src, i) => (
            <div key={i} className="relative flex-none w-24 h-32 rounded-lg overflow-hidden border border-zinc-200 shadow-sm group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setGalleryFiles((p) => p.filter((_, idx) => idx !== i));
                  setGalleryPreviews((p) => p.filter((_, idx) => idx !== i));
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 hover:bg-red-50 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3 h-3 text-red-500" />
              </button>
              <div className="absolute bottom-1 left-0 right-0 flex justify-center pointer-events-none">
                <span className="text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded">{i + 1}</span>
              </div>
            </div>
          ))}

          <label className="flex-none w-24 h-32 rounded-lg border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer">
            <Plus className="w-5 h-5 text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Add images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (!e.target.files) return;
                const arr = Array.from(e.target.files);
                setGalleryFiles((p) => [...p, ...arr]);
                setGalleryPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
              }}
            />
          </label>
        </div>
      </section>

      {/* ── Wall Art: Size Variants ── */}
      {productType === "wall_art" && (
        <section className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Size Variants & Pricing</h2>

          <div className="grid grid-cols-[16px_80px_1fr_1fr_1fr_60px] gap-2 px-2">
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
                    "grid grid-cols-[16px_80px_1fr_1fr_1fr_60px] items-center gap-2 px-2 py-1.5 rounded-md",
                    s.enabled ? "bg-white border border-zinc-200" : "opacity-40"
                  )}
                >
                  <input type="checkbox" checked={s.enabled}
                    onChange={(e) => setSizes((p) => ({ ...p, [size]: { ...p[size], enabled: e.target.checked } }))}
                    className="w-3.5 h-3.5 rounded accent-indigo-600"
                  />
                  <span className="text-xs font-medium text-zinc-700">{FRAME_SIZE_LABELS[size]}</span>
                  <input value={s.price} onChange={(e) => setSizes((p) => ({ ...p, [size]: { ...p[size], price: e.target.value } }))}
                    placeholder="0.00" disabled={!s.enabled}
                    className="w-full h-9 px-2 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
                  />
                  <input value={s.compareAtPrice} onChange={(e) => setSizes((p) => ({ ...p, [size]: { ...p[size], compareAtPrice: e.target.value } }))}
                    placeholder="0.00" disabled={!s.enabled}
                    className="w-full h-9 px-2 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
                  />
                  <input value={s.sku} onChange={(e) => setSizes((p) => ({ ...p, [size]: { ...p[size], sku: e.target.value } }))}
                    placeholder="ALK-XXXXX" disabled={!s.enabled}
                    className="w-full h-9 px-2 rounded-md border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
                  />
                  <input value={s.stock} onChange={(e) => setSizes((p) => ({ ...p, [size]: { ...p[size], stock: e.target.value } }))}
                    disabled={!s.enabled}
                    className="w-full h-9 px-2 rounded-md border border-zinc-200 bg-white text-sm text-center text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-400 px-2">SKUs auto-fill when you blur the design name field.</p>
        </section>
      )}

      {/* ── Submit ── */}
      <div className="bg-white border border-zinc-200 rounded-lg px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-900">
            {productType === "wall_art"
              ? `Publishing ${name ? `"${name} — ${FRAME_TYPE_LABELS[frameType]}"` : "Wall Art"}`
              : `Creating ${name ? `"${name}"` : "General Product"}`
            }
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {productType === "wall_art"
              ? "After publishing, group it with other frame types on the edit page."
              : "Product will be live immediately after creation."
            }
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 whitespace-nowrap flex-none"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating…" : "Create Product"}
        </button>
      </div>
    </div>
  );
}
