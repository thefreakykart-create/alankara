"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Trash2, ToggleLeft, ToggleRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { toggleProductFieldAction, deleteProductAction } from "@/app/admin/actions";

interface Variant {
  product_id: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  product_type: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  images: string[] | null;
  sku: string | null;
  created_at: string;
  category: { name?: string }[] | { name?: string } | null;
}

interface Props {
  products: Product[];
  variants: Variant[];
}

const PAGE_SIZE = 15;

export default function ProductsTable({ products, variants }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const variantMap = useMemo(() => {
    const map = new Map<string, { count: number; activeCount: number; minPrice: number | null; stock: number }>();
    for (const v of variants) {
      const cur = map.get(v.product_id) ?? { count: 0, activeCount: 0, minPrice: null, stock: 0 };
      cur.count += 1;
      cur.stock += v.stock_quantity;
      if (v.is_active) cur.activeCount += 1;
      cur.minPrice = cur.minPrice === null ? v.price : Math.min(cur.minPrice, v.price);
      map.set(v.product_id, cur);
    }
    return map;
  }, [variants]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && p.product_type !== typeFilter) return false;
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      return true;
    });
  }, [products, search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggle = (id: string, field: "is_active" | "is_featured", value: boolean) => {
    setPendingId(id + field);
    startTransition(async () => {
      await toggleProductFieldAction(id, field, value);
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or SKU…"
            className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="general">General</option>
          <option value="wall_art">Wall Art</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-xs text-zinc-400">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
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
                <th className="px-5 py-3 text-center text-xs font-medium text-zinc-500">Active</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-zinc-500">Featured</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-zinc-500">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.map((product) => {
                const vs = variantMap.get(product.id);
                const catRel = product.category as { name?: string }[] | { name?: string } | null;
                const catName = Array.isArray(catRel) ? catRel[0]?.name : catRel?.name;
                const displayPrice = product.product_type === "wall_art" ? vs?.minPrice ?? 0 : product.price;
                const displayStock = product.product_type === "wall_art" ? vs?.stock ?? 0 : product.stock_quantity;

                return (
                  <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 overflow-hidden rounded-md bg-zinc-100 flex-none">
                          <Image
                            src={product.images?.[0] || "/placeholder.jpg"}
                            alt={product.name}
                            fill sizes="36px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium text-zinc-900 hover:text-indigo-600 transition-colors truncate block max-w-[200px]"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-zinc-400 truncate max-w-[200px]">
                            {product.sku || product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{catName || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                        {product.product_type === "wall_art" ? "Wall Art" : "General"}
                      </span>
                      {product.product_type === "wall_art" && vs && (
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {vs.activeCount}/{vs.count} variants
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-zinc-900 tabular-nums">
                      {product.product_type === "wall_art" ? `From ${formatINR(displayPrice)}` : formatINR(displayPrice)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-medium tabular-nums ${displayStock <= 5 ? "text-red-600" : "text-zinc-900"}`}>
                        {displayStock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        disabled={pendingId === product.id + "is_active"}
                        onClick={() => toggle(product.id, "is_active", !product.is_active)}
                        className="disabled:opacity-40 transition-opacity"
                        title={product.is_active ? "Deactivate" : "Activate"}
                      >
                        {product.is_active
                          ? <ToggleRight className="w-6 h-6 text-emerald-600" />
                          : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        disabled={pendingId === product.id + "is_featured"}
                        onClick={() => toggle(product.id, "is_featured", !product.is_featured)}
                        className="disabled:opacity-40 transition-opacity"
                        title={product.is_featured ? "Unfeature" : "Feature"}
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${product.is_featured ? "fill-amber-400 text-amber-400" : "text-zinc-300 hover:text-zinc-400"}`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <form
                        action={deleteProductAction}
                        onSubmit={(e) => {
                          if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="productId" value={product.id} />
                        <button
                          type="submit"
                          className="text-zinc-300 hover:text-red-500 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-zinc-400">
                    No products match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .reduce<(number | "…")[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((item, i) =>
                item === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-zinc-400 text-sm">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`h-8 w-8 text-sm rounded-md border transition-colors ${
                      item === safePage
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {pending && <p className="text-xs text-zinc-400">Saving…</p>}
    </div>
  );
}
