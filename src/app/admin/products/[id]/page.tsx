import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  updateProductAction,
  updateProductVariantAction,
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";
import {
  FRAME_SIZE_LABELS,
  FRAME_TYPE_LABELS,
  type FrameSize,
  type FrameType,
} from "@/lib/types/product";

interface AdminProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdminProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Manage Product ${id} — Alankara Admin`,
  };
}

export default async function AdminProductDetailPage({
  params,
}: AdminProductDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: product }, { data: categories }, { data: variants }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*, category:categories(name)")
        .eq("id", id)
        .single(),
      supabase
        .from("categories")
        .select("id, name")
        .order("display_order", { ascending: true }),
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("frame_type", { ascending: true })
        .order("size", { ascending: true }),
    ]);

  if (!product) notFound();

  const categoryRelation = product.category as
    | { name?: string }[]
    | { name?: string }
    | null
    | undefined;
  const categoryName = Array.isArray(categoryRelation)
    ? categoryRelation[0]?.name
    : categoryRelation?.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
            Product Detail
          </p>
          <h2 className="mt-1 font-serif text-3xl text-charcoal">
            {product.name}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {product.product_type === "wall_art"
              ? "Variant-managed wall art product"
              : "General catalog product"}
          </p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-sm border border-charcoal px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-charcoal transition-colors hover:bg-charcoal hover:text-warm-white"
        >
          Back to Products
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <form
          action={updateProductAction}
          className="rounded-sm border border-border bg-warm-white p-5 shadow-sm"
        >
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="productType" value={product.product_type} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Name
              </span>
              <input
                name="name"
                defaultValue={product.name}
                required
                className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Slug
              </span>
              <input
                name="slug"
                defaultValue={product.slug}
                className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Description
              </span>
              <textarea
                name="description"
                rows={5}
                defaultValue={product.description ?? ""}
                className="w-full rounded-sm border border-border px-3 py-3 text-sm focus:border-charcoal focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Category
              </span>
              <select
                name="categoryId"
                defaultValue={product.category_id ?? ""}
                className="h-11 w-full rounded-sm border border-border bg-transparent px-3 text-sm focus:border-charcoal focus:outline-none"
              >
                <option value="">None</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                SKU
              </span>
              <input
                name="sku"
                defaultValue={product.sku ?? ""}
                className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
              />
            </label>

            {product.product_type === "general" && (
              <>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-muted">
                    Price (INR)
                  </span>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={product.price / 100}
                    className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-muted">
                    Compare At Price
                  </span>
                  <input
                    name="compareAtPrice"
                    type="number"
                    step="0.01"
                    defaultValue={
                      product.compare_at_price
                        ? product.compare_at_price / 100
                        : ""
                    }
                    className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.16em] text-muted">
                    Stock Quantity
                  </span>
                  <input
                    name="stockQuantity"
                    type="number"
                    defaultValue={product.stock_quantity}
                    className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                  />
                </label>
              </>
            )}

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Weight (grams)
              </span>
              <input
                name="weightGrams"
                type="number"
                defaultValue={product.weight_grams ?? ""}
                className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Material
              </span>
              <input
                name="material"
                defaultValue={product.metadata?.material ?? ""}
                className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Care Instructions
              </span>
              <input
                name="care"
                defaultValue={product.metadata?.care ?? ""}
                className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Image URLs
              </span>
              <textarea
                name="imageUrls"
                rows={4}
                defaultValue={(product.images ?? []).join("\n")}
                className="w-full rounded-sm border border-border px-3 py-3 text-sm focus:border-charcoal focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-charcoal">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={product.is_active}
                className="h-4 w-4 accent-charcoal"
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-charcoal">
              <input
                name="isFeatured"
                type="checkbox"
                defaultChecked={product.is_featured}
                className="h-4 w-4 accent-charcoal"
              />
              Featured
            </label>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              className="rounded-sm bg-charcoal px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-warm-white transition-colors hover:bg-terracotta"
            >
              Save Product
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
            <h3 className="font-medium text-charcoal">Quick Summary</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div className="flex justify-between gap-4">
                <span>Type</span>
                <span className="font-medium text-charcoal">
                  {product.product_type === "wall_art" ? "Wall Art" : "General"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Category</span>
                <span className="font-medium text-charcoal">
                  {categoryName || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Status</span>
                <span className="font-medium text-charcoal">
                  {product.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Created</span>
                <span className="font-medium text-charcoal">
                  {new Date(product.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Updated</span>
                <span className="font-medium text-charcoal">
                  {new Date(product.updated_at).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
            <h3 className="font-medium text-charcoal">Gallery Preview</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(product.images ?? []).length > 0 ? (
                product.images.map((image: string, index: number) => (
                  <div
                    key={`${image}-${index}`}
                    className="relative aspect-[3/4] overflow-hidden rounded-sm bg-cream"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-sm text-muted">
                  No base images set on this product.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {product.product_type === "wall_art" && (
        <section className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-charcoal">Variants</h3>
              <p className="text-sm text-muted">
                Update pricing, SKU, stock, and active state per frame option.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/40">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                    Variant
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.16em] text-muted">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.16em] text-muted">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-center text-xs uppercase tracking-[0.16em] text-muted">
                    Save
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants?.map(
                  (
                    variant: {
                      id: string;
                      frame_type: FrameType;
                      size: FrameSize;
                      images: string[];
                      sku: string | null;
                      price: number;
                      compare_at_price: number | null;
                      stock_quantity: number;
                      is_active: boolean;
                    }
                  ) => (
                  <tr key={variant.id} className="border-b border-border/70">
                    <td className="px-4 py-4">
                      <p className="font-medium text-charcoal">
                        {FRAME_TYPE_LABELS[variant.frame_type]} ·{" "}
                        {FRAME_SIZE_LABELS[variant.size]}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {variant.images?.length ?? 0} gallery image
                        {(variant.images?.length ?? 0) === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <form
                        action={updateProductVariantAction}
                        className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px_120px_110px_auto]"
                      >
                        <input type="hidden" name="variantId" value={variant.id} />
                        <input type="hidden" name="productId" value={product.id} />
                        <input
                          name="sku"
                          defaultValue={variant.sku ?? ""}
                          className="h-10 min-w-[160px] rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                        />
                        <input
                          name="price"
                          type="number"
                          step="0.01"
                          defaultValue={variant.price / 100}
                          className="h-10 rounded-sm border border-border px-3 text-right text-sm focus:border-charcoal focus:outline-none"
                        />
                        <input
                          name="compareAtPrice"
                          type="number"
                          step="0.01"
                          defaultValue={
                            variant.compare_at_price
                              ? variant.compare_at_price / 100
                              : ""
                          }
                          placeholder="Compare"
                          className="h-10 rounded-sm border border-border px-3 text-right text-sm focus:border-charcoal focus:outline-none"
                        />
                        <input
                          name="stockQuantity"
                          type="number"
                          defaultValue={variant.stock_quantity}
                          className="h-10 rounded-sm border border-border px-3 text-right text-sm focus:border-charcoal focus:outline-none"
                        />
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 text-xs text-muted">
                            <input
                              name="isActive"
                              type="checkbox"
                              defaultChecked={variant.is_active}
                              className="h-4 w-4 accent-charcoal"
                            />
                            Active
                          </label>
                          <button
                            type="submit"
                            className="rounded-sm border border-charcoal px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-charcoal transition-colors hover:bg-charcoal hover:text-warm-white"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-charcoal">
                      {formatINR(variant.price)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-charcoal">
                      {variant.stock_quantity}
                    </td>
                    <td className="px-4 py-4 text-center text-xs text-muted">
                      {variant.is_active ? "Active" : "Inactive"}
                    </td>
                  </tr>
                )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
