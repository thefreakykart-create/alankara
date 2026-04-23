import Link from "next/link";
import Image from "next/image";
import { Plus, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products — Alankara Admin",
};

export default async function AdminProductsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: products }, { data: variants }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, product_type, price, stock_quantity, is_active, is_featured, images, sku, created_at, category:categories(name)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("product_variants")
      .select("id, product_id, price, stock_quantity, is_active"),
  ]);

  const variantMap = new Map<
    string,
    { count: number; activeCount: number; minPrice: number | null; stock: number }
  >();

  for (const v of variants ?? []) {
    const cur = variantMap.get(v.product_id) ?? {
      count: 0,
      activeCount: 0,
      minPrice: null,
      stock: 0,
    };
    cur.count += 1;
    cur.stock += v.stock_quantity;
    if (v.is_active) cur.activeCount += 1;
    cur.minPrice =
      cur.minPrice === null ? v.price : Math.min(cur.minPrice, v.price);
    variantMap.set(v.product_id, cur);
  }

  const activeCount = products?.filter((p) => p.is_active).length ?? 0;
  const featuredCount = products?.filter((p) => p.is_featured).length ?? 0;
  const wallArtCount =
    products?.filter((p) => p.product_type === "wall_art").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage catalog, pricing, and inventory.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-300 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
          <Link
            href="/admin/products/publish"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Publish Wall Art
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Products", value: products?.length ?? 0 },
          { label: "Active", value: activeCount, sub: `${featuredCount} featured` },
          { label: "Wall Art", value: wallArtCount, sub: "Variant-managed" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-4">
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-zinc-900 tabular-nums">{s.value}</p>
            {s.sub && <p className="mt-0.5 text-xs text-zinc-400">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Product</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Category</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Type</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Price</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Stock</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products?.map((product) => {
                const vs = variantMap.get(product.id);
                const catRel = product.category as
                  | { name?: string }[]
                  | { name?: string }
                  | null
                  | undefined;
                const catName = Array.isArray(catRel)
                  ? catRel[0]?.name
                  : catRel?.name;
                const displayPrice =
                  product.product_type === "wall_art"
                    ? vs?.minPrice ?? 0
                    : product.price;
                const displayStock =
                  product.product_type === "wall_art"
                    ? vs?.stock ?? 0
                    : product.stock_quantity;

                return (
                  <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-md bg-zinc-100 flex-none">
                          <Image
                            src={product.images?.[0] || "/placeholder.jpg"}
                            alt={product.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium text-zinc-900 hover:text-indigo-600 transition-colors"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-zinc-400">
                            {product.sku || product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-500 text-sm">
                      {catName || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                        {product.product_type === "wall_art" ? "Wall Art" : "General"}
                      </span>
                      {product.product_type === "wall_art" && (
                        <p className="mt-1 text-xs text-zinc-400">
                          {vs?.activeCount ?? 0}/{vs?.count ?? 0} variants active
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-zinc-900 tabular-nums">
                      {product.product_type === "wall_art"
                        ? `From ${formatINR(displayPrice)}`
                        : formatINR(displayPrice)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`font-medium tabular-nums ${
                          displayStock <= 5 ? "text-red-600" : "text-zinc-900"
                        }`}
                      >
                        {displayStock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                      {product.is_featured && (
                        <p className="mt-1 text-[10px] font-medium text-indigo-500">Featured</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
