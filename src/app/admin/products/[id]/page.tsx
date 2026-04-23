import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import {
  updateProductAction,
  updateProductVariantAction,
  deleteProductAction,
  updateVariantImagesAction,
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";
import {
  FRAME_SIZE_LABELS,
  FRAME_TYPE_LABELS,
  type FrameSize,
  type FrameType,
} from "@/lib/types/product";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Edit Product — Alankara Admin` };
}

const inputCls =
  "w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const textareaCls =
  "w-full px-3 py-2.5 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none";
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

export default async function AdminProductDetailPage({ params }: Props) {
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

  const catRel = product.category as
    | { name?: string }[]
    | { name?: string }
    | null
    | undefined;
  const catName = Array.isArray(catRel) ? catRel[0]?.name : catRel?.name;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">{product.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {product.product_type === "wall_art"
              ? "Variant-managed wall art"
              : "General catalog product"}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
            product.is_active
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {product.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* Edit form */}
        <form
          action={updateProductAction}
          className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4"
        >
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="productType" value={product.product_type} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Name *</label>
              <input name="name" defaultValue={product.name} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input name="slug" defaultValue={product.slug} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                name="description"
                rows={4}
                defaultValue={product.description ?? ""}
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select
                name="categoryId"
                defaultValue={product.category_id ?? ""}
                className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>SKU</label>
              <input name="sku" defaultValue={product.sku ?? ""} className={inputCls} />
            </div>

            {product.product_type === "general" && (
              <>
                <div>
                  <label className={labelCls}>Price (INR)</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={product.price / 100}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Compare At Price</label>
                  <input
                    name="compareAtPrice"
                    type="number"
                    step="0.01"
                    defaultValue={product.compare_at_price ? product.compare_at_price / 100 : ""}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Stock Quantity</label>
                  <input
                    name="stockQuantity"
                    type="number"
                    defaultValue={product.stock_quantity}
                    className={inputCls}
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelCls}>Weight (grams)</label>
              <input
                name="weightGrams"
                type="number"
                defaultValue={product.weight_grams ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Material</label>
              <input
                name="material"
                defaultValue={product.metadata?.material ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Care Instructions</label>
              <input
                name="care"
                defaultValue={product.metadata?.care ?? ""}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Image URLs (one per line)</label>
              <textarea
                name="imageUrls"
                rows={4}
                defaultValue={(product.images ?? []).join("\n")}
                className={textareaCls}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={product.is_active}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
              <input
                name="isFeatured"
                type="checkbox"
                defaultChecked={product.is_featured}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              Featured
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Save Product
            </button>
            <form
              action={deleteProductAction}
              onSubmit={(e) => {
                if (!confirm("Delete this product? This cannot be undone.")) e.preventDefault();
              }}
            >
              <input type="hidden" name="productId" value={product.id} />
              <button
                type="submit"
                className="px-5 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium rounded-md transition-colors"
              >
                Delete Product
              </button>
            </form>
          </div>
        </form>

        {/* Sidebar info */}
        <aside className="space-y-5">
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Summary</h2>
            <div className="space-y-2.5 text-sm">
              {[
                { label: "Type", value: product.product_type === "wall_art" ? "Wall Art" : "General" },
                { label: "Category", value: catName || "—" },
                { label: "Status", value: product.is_active ? "Active" : "Inactive" },
                { label: "Created", value: new Date(product.created_at).toLocaleDateString("en-IN") },
                { label: "Updated", value: new Date(product.updated_at).toLocaleDateString("en-IN") },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <span className="text-zinc-500">{row.label}</span>
                  <span className="font-medium text-zinc-900 text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Gallery</h2>
            {(product.images ?? []).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {product.images.map((img: string, i: number) => (
                  <div
                    key={`${img}-${i}`}
                    className="relative aspect-[3/4] overflow-hidden rounded-md bg-zinc-100"
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      sizes="140px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No images set.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Variants table (wall art only) */}
      {product.product_type === "wall_art" && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Variants</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Update pricing, SKU, stock, and active state per frame option.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Variant</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 min-w-[500px]">Edit</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Current Price</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {variants?.map(
                  (v: {
                    id: string;
                    frame_type: FrameType;
                    size: FrameSize;
                    images: string[];
                    sku: string | null;
                    price: number;
                    compare_at_price: number | null;
                    stock_quantity: number;
                    is_active: boolean;
                  }) => (
                    <tr key={v.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <p className="font-medium text-zinc-900">
                          {FRAME_TYPE_LABELS[v.frame_type]} · {FRAME_SIZE_LABELS[v.size]}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {v.images?.length ?? 0} image{(v.images?.length ?? 0) === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <form
                          action={updateProductVariantAction}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="variantId" value={v.id} />
                          <input type="hidden" name="productId" value={product.id} />
                          <input
                            name="sku"
                            defaultValue={v.sku ?? ""}
                            placeholder="SKU"
                            className="h-9 w-40 px-3 rounded-md border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            name="price"
                            type="number"
                            step="0.01"
                            defaultValue={v.price / 100}
                            placeholder="Price"
                            className="h-9 w-28 px-3 rounded-md border border-zinc-200 bg-white text-xs text-right text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            name="compareAtPrice"
                            type="number"
                            step="0.01"
                            defaultValue={v.compare_at_price ? v.compare_at_price / 100 : ""}
                            placeholder="Compare"
                            className="h-9 w-28 px-3 rounded-md border border-zinc-200 bg-white text-xs text-right text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            name="stockQuantity"
                            type="number"
                            defaultValue={v.stock_quantity}
                            placeholder="Stock"
                            className="h-9 w-20 px-3 rounded-md border border-zinc-200 bg-white text-xs text-right text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer">
                            <input
                              name="isActive"
                              type="checkbox"
                              defaultChecked={v.is_active}
                              className="h-3.5 w-3.5 rounded accent-indigo-600"
                            />
                            Active
                          </label>
                          <button
                            type="submit"
                            className="h-9 px-3 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md transition-colors"
                          >
                            Save
                          </button>
                        </form>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-zinc-900 tabular-nums align-top">
                        {formatINR(v.price)}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-zinc-900 tabular-nums align-top">
                        {v.stock_quantity}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Variant image management */}
      {product.product_type === "wall_art" && variants && variants.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-1">Variant Images</h2>
          <p className="text-sm text-zinc-500 mb-5">
            Update gallery image URLs per frame variant (one URL per line).
          </p>
          <div className="space-y-4">
            {variants.map((v: {
              id: string;
              frame_type: FrameType;
              size: FrameSize;
              images: string[];
            }) => (
              <form key={v.id} action={updateVariantImagesAction} className="grid gap-3 md:grid-cols-[200px_1fr_auto] items-start">
                <input type="hidden" name="variantId" value={v.id} />
                <input type="hidden" name="productId" value={product.id} />
                <div className="pt-2">
                  <p className="text-sm font-medium text-zinc-900">
                    {FRAME_TYPE_LABELS[v.frame_type]}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{FRAME_SIZE_LABELS[v.size]}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{v.images?.length ?? 0} image{(v.images?.length ?? 0) !== 1 ? "s" : ""}</p>
                </div>
                <textarea
                  name="imageUrls"
                  rows={3}
                  defaultValue={(v.images ?? []).join("\n")}
                  placeholder="https://…&#10;https://…"
                  className="w-full px-3 py-2.5 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs"
                />
                <button
                  type="submit"
                  className="h-10 px-4 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                >
                  Save
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
