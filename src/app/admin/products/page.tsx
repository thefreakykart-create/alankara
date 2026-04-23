import Link from "next/link";
import Image from "next/image";
import { Plus, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Manage Products — Alankara Admin",
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

  for (const variant of variants ?? []) {
    const current = variantMap.get(variant.product_id) ?? {
      count: 0,
      activeCount: 0,
      minPrice: null,
      stock: 0,
    };

    current.count += 1;
    current.stock += variant.stock_quantity;
    if (variant.is_active) current.activeCount += 1;
    current.minPrice =
      current.minPrice === null
        ? variant.price
        : Math.min(current.minPrice, variant.price);
    variantMap.set(variant.product_id, current);
  }

  const activeProducts = products?.filter((product) => product.is_active).length ?? 0;
  const featuredProducts = products?.filter((product) => product.is_featured).length ?? 0;
  const wallArtProducts =
    products?.filter((product) => product.product_type === "wall_art").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
            Catalog
          </p>
          <h2 className="mt-1 font-serif text-3xl text-charcoal">Products</h2>
          <p className="mt-2 text-sm text-muted">
            Review availability, featured status, and drill into individual
            products to edit catalog data.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-sm border border-charcoal px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-charcoal transition-colors hover:bg-charcoal hover:text-warm-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add General Product
          </Link>
          <Link
            href="/admin/products/publish"
            className="inline-flex items-center gap-2 rounded-sm bg-charcoal px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-warm-white transition-colors hover:bg-terracotta"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Publish Wall Art
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Total Products
          </p>
          <p className="mt-3 font-serif text-3xl text-charcoal">
            {products?.length ?? 0}
          </p>
        </div>
        <div className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Active Catalog
          </p>
          <p className="mt-3 font-serif text-3xl text-charcoal">
            {activeProducts}
          </p>
          <p className="mt-2 text-sm text-muted">{featuredProducts} featured</p>
        </div>
        <div className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Wall Art
          </p>
          <p className="mt-3 font-serif text-3xl text-charcoal">
            {wallArtProducts}
          </p>
          <p className="mt-2 text-sm text-muted">Variant-managed products</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-border bg-warm-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/40">
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                  Product
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                  Category
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                  Type
                </th>
                <th className="px-5 py-3 text-right text-xs uppercase tracking-[0.16em] text-muted">
                  Price
                </th>
                <th className="px-5 py-3 text-right text-xs uppercase tracking-[0.16em] text-muted">
                  Stock
                </th>
                <th className="px-5 py-3 text-center text-xs uppercase tracking-[0.16em] text-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product) => {
                const variantSummary = variantMap.get(product.id);
                const categoryRelation = product.category as
                  | { name?: string }[]
                  | { name?: string }
                  | null
                  | undefined;
                const categoryName = Array.isArray(categoryRelation)
                  ? categoryRelation[0]?.name
                  : categoryRelation?.name;
                const displayPrice =
                  product.product_type === "wall_art"
                    ? variantSummary?.minPrice ?? 0
                    : product.price;
                const displayStock =
                  product.product_type === "wall_art"
                    ? variantSummary?.stock ?? 0
                    : product.stock_quantity;

                return (
                  <tr key={product.id} className="border-b border-border/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-cream">
                          <Image
                            src={product.images?.[0] || "/placeholder.jpg"}
                            alt={product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium text-charcoal hover:text-terracotta"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 truncate text-xs text-muted">
                            {product.sku || product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {categoryName || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-charcoal w-fit">
                          {product.product_type === "wall_art"
                            ? "Wall Art"
                            : "General"}
                        </span>
                        {product.product_type === "wall_art" && (
                          <span className="text-xs text-muted">
                            {variantSummary?.activeCount ?? 0}/
                            {variantSummary?.count ?? 0} variants active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-charcoal">
                      {product.product_type === "wall_art"
                        ? `From ${formatINR(displayPrice)}`
                        : formatINR(displayPrice)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={
                          displayStock <= 5
                            ? "font-medium text-terracotta"
                            : "text-charcoal"
                        }
                      >
                        {displayStock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            product.is_active
                              ? "bg-emerald/10 text-emerald"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                        {product.is_featured && (
                          <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                            Featured
                          </span>
                        )}
                      </div>
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
