import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import ProductsTable from "@/components/admin/products-table";

export const metadata: Metadata = { title: "Products — Alankara Admin" };

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

  const activeCount = products?.filter((p) => p.is_active).length ?? 0;
  const featuredCount = products?.filter((p) => p.is_featured).length ?? 0;
  const wallArtCount = products?.filter((p) => p.product_type === "wall_art").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage catalog, pricing, and inventory.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

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

      <ProductsTable
        products={(products ?? []) as Parameters<typeof ProductsTable>[0]["products"]}
        variants={variants ?? []}
      />
    </div>
  );
}
