"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { Loader2, CheckCircle2, ImageIcon, X, Plus, ChevronRight } from "lucide-react";
import type { Category } from "@/lib/types/product";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [sku, setSku] = useState("");
  const [weightGrams, setWeightGrams] = useState("");
  const [material, setMaterial] = useState("");
  const [care, setCare] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const featuredRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [doneId, setDoneId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    createClient().from("categories").select("*").order("display_order")
      .then(({ data }) => { if (data) setCategories(data); });
  }, []);

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
    if (!price) return setError("Price is required.");

    setLoading(true);
    try {
      const ts = Date.now();
      const slug = generateSlug(name);

      const featuredUrl = await uploadFile(
        featuredFile,
        `products/${slug}/featured-${ts}.${featuredFile.name.split(".").pop()}`
      );

      const galleryUrls: string[] = [];
      for (const file of galleryFiles) {
        const url = await uploadFile(
          file,
          `products/${slug}/gallery-${ts}-${Math.random().toString(36).slice(2)}.${file.name.split(".").pop()}`
        );
        galleryUrls.push(url);
      }

      const metadata: Record<string, string> = {};
      if (material) metadata.material = material;
      if (care) metadata.care = care;
      if (tags) metadata.tags = tags;

      const supabase = createClient();
      const { data, error: insertErr } = await supabase.from("products").insert({
        name,
        slug,
        description: description || null,
        product_type: "general",
        price: Math.round(parseFloat(price) * 100),
        compare_at_price: compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : null,
        category_id: categoryId,
        images: [featuredUrl, ...galleryUrls],
        sku: sku || null,
        stock_quantity: parseInt(stock) || 0,
        is_featured: isFeatured,
        is_active: true,
        weight_grams: weightGrams ? parseInt(weightGrams) : null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      }).select("id").single();

      if (insertErr) throw new Error(insertErr.message);
      setDoneId(data.id);
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
          <p className="text-sm text-zinc-500 mt-1">&ldquo;{name}&rdquo; is now live.</p>
        </div>
        <div className="flex gap-3">
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
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Add Product</h1>
        <p className="mt-1 text-sm text-zinc-500">Create a new home decor product.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* ── Product Details ── */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Product Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Product Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Handcrafted Brass Diya"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Category *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>SKU</label>
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="ALK-XXXXX" className={`${inputCls} font-mono`} />
          </div>

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
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="brass, festive, handcrafted, diwali"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ── Pricing & Stock ── */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Pricing & Stock</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Price (₹) *</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Compare At (₹)</label>
            <input type="number" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Stock Qty</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Weight (g)</label>
            <input type="number" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Material</label>
            <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. Brass, Teak wood" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Care Instructions</label>
            <input value={care} onChange={(e) => setCare(e.target.value)} placeholder="e.g. Wipe with dry cloth" className={inputCls} />
          </div>
        </div>

        <label className="inline-flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
          <span className="text-sm text-zinc-700">Feature on homepage</span>
        </label>
      </section>

      {/* ── Featured Image ── */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Featured Image <span className="text-red-500">*</span></h2>
          <p className="text-xs text-zinc-500 mt-0.5">Shown on product cards and search results. Use a clean, well-lit photo.</p>
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
                <p className="text-[10px] text-zinc-400 mt-0.5">JPG, PNG, WebP</p>
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

          <div className="space-y-1.5 pt-1 text-xs text-zinc-500">
            <p className="font-medium text-zinc-700">Recommendations</p>
            <p>3:4 ratio — e.g. 900 × 1200 px</p>
            <p>Well-lit, neutral background</p>
            <p>Under 5 MB</p>
          </div>
        </div>
      </section>

      {/* ── Gallery Images ── */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Gallery Images</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Additional photos shown in the product page slideshow.</p>
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

          <label className={cn(
            "flex-none w-24 h-32 rounded-lg border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer",
          )}>
            <Plus className="w-5 h-5 text-zinc-400" />
            <span className="text-[10px] text-zinc-400">Add photos</span>
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

      {/* ── Submit ── */}
      <div className="bg-white border border-zinc-200 rounded-lg px-5 py-4 flex items-center justify-between gap-4">
        <p className="text-xs text-zinc-400">Product will be live immediately after creation.</p>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating…" : "Create Product"}
        </button>
      </div>
    </div>
  );
}
