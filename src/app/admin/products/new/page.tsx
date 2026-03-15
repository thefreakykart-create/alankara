"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
import type { Category } from "@/lib/types/product";

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
    const supabase = createClient();
    supabase
      .from("categories")
      .select("*")
      .order("display_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

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

      // Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(path);
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
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide mb-8">
          Add New Product
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
              Product Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent resize-none"
            />
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
                Price (INR) *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                required
                className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
                Compare At Price
              </label>
              <input
                type="number"
                step="0.01"
                value={form.compareAtPrice}
                onChange={(e) => updateField("compareAtPrice", e.target.value)}
                className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent"
              />
            </div>
          </div>

          {/* Category + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
                Category
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => updateField("categoryId", e.target.value)}
                className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
                SKU
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => updateField("sku", e.target.value)}
                className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent"
              />
            </div>
          </div>

          {/* Stock + Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => updateField("stockQuantity", e.target.value)}
                className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
                Weight (grams)
              </label>
              <input
                type="number"
                value={form.weightGrams}
                onChange={(e) => updateField("weightGrams", e.target.value)}
                className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent"
              />
            </div>
          </div>

          {/* Material + Care */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
                Material
              </label>
              <input
                type="text"
                value={form.material}
                onChange={(e) => updateField("material", e.target.value)}
                className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
                Care Instructions
              </label>
              <input
                type="text"
                value={form.care}
                onChange={(e) => updateField("care", e.target.value)}
                className="w-full h-11 px-4 border border-border rounded-sm text-sm focus:outline-none focus:border-charcoal bg-transparent"
              />
            </div>
          </div>

          {/* Featured toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => updateField("isFeatured", e.target.checked)}
              className="w-4 h-4 accent-terracotta"
            />
            <span className="text-sm text-charcoal">Featured Product</span>
          </label>

          {/* Images */}
          <div>
            <label className="block text-xs text-muted mb-1.5 tracking-wider uppercase">
              Product Images
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-sm cursor-pointer hover:border-charcoal transition-colors">
              <Upload className="w-6 h-6 text-muted mb-2" />
              <span className="text-xs text-muted">
                {images.length > 0
                  ? `${images.length} file(s) selected`
                  : "Click to upload images"}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !form.name || !form.price}
            className="w-full h-11 bg-charcoal text-warm-white text-sm font-medium tracking-[0.1em] uppercase rounded-sm hover:bg-terracotta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create Product"}
          </button>
        </form>
      </div>
    </main>
  );
}
