"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
import type { Category } from "@/lib/types/product";

const inputCls =
  "w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    categoryId: "",
    sku: "",
    stockQuantity: "0",
    isFeatured: false,
    weightGrams: "",
    material: "",
    care: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    createClient()
      .from("categories")
      .select("*")
      .order("display_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const slug = generateSlug(form.name);
      const priceInPaise = Math.round(parseFloat(form.price) * 100);
      const compareAtPriceInPaise = form.compareAtPrice
        ? Math.round(parseFloat(form.compareAtPrice) * 100)
        : null;

      const imageUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        imageUrls.push(publicUrl);
      }

      const metadata: Record<string, string> = {};
      if (form.material) metadata.material = form.material;
      if (form.care) metadata.care = form.care;

      const { error: insertError } = await supabase.from("products").insert({
        name: form.name,
        slug,
        description: form.description || null,
        price: priceInPaise,
        compare_at_price: compareAtPriceInPaise,
        category_id: form.categoryId || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        sku: form.sku || null,
        stock_quantity: parseInt(form.stockQuantity) || 0,
        is_featured: form.isFeatured,
        weight_grams: form.weightGrams ? parseInt(form.weightGrams) : null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      });

      if (insertError) throw insertError;
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">New Product</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Add a general catalog product with direct pricing and stock.
        </p>
      </div>

      <div className="max-w-3xl bg-white border border-zinc-200 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                className={inputCls}
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className={labelCls}>Price (INR) *</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Compare At Price</label>
              <input
                type="number"
                step="0.01"
                value={form.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>SKU</label>
              <input
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Stock Quantity *</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => set("stockQuantity", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Weight (grams)</label>
              <input
                type="number"
                value={form.weightGrams}
                onChange={(e) => set("weightGrams", e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Material</label>
              <input
                value={form.material}
                onChange={(e) => set("material", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Care Instructions</label>
              <input
                value={form.care}
                onChange={(e) => set("care", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-zinc-700">Featured on homepage</span>
          </label>

          <div>
            <label className={labelCls}>Product Images</label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-200 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
              <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
              <span className="text-sm text-zinc-500">
                {images.length > 0
                  ? `${images.length} file${images.length > 1 ? "s" : ""} selected`
                  : "Click to upload images"}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && setImages(Array.from(e.target.files))}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.name || !form.price}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating…" : "Create Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
