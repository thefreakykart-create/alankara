import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import {
  updateProductAction,
  updateProductVariantAction,
} from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { createAdminServiceClient } from "@/lib/admin";
import { formatINR } from "@/lib/utils";
import DeleteProductButton from "@/components/admin/delete-product-button";
import ProductGroupPanel from "@/components/admin/product-group-panel";
import EditProductImages from "@/components/admin/edit-product-images";
import {
  FRAME_SIZE_LABELS,
  FRAME_TYPE_LABELS,
  type FrameSize,
  type FrameType,
  type GroupProduct,
  type ProductGroup,
} from "@/lib/types/product";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  void id;
  return { title: "Edit Product — Alankara Admin" };
}

const inputCls =
  "w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const textareaCls =
  "w-full px-3 py-2.5 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed";
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default async function AdminProductDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const admin = createAdminServiceClient();

  const [{ data: product }, { data: categories }, { data: variants }] =
    await Promise.all([
      supabase.from("products").select("*, category:categories(name)").eq("id", id).single(),
      supabase.from("categories").select("id, name").order("display_order", { ascending: true }),
      supabase.from("product_variants").select("*").eq("product_id", id).order("size", { ascending: true }),
    ]);

  if (!product) notFound();

  const [{ data: allGroups }, { data: groupMembers }] = await Promise.all([
    admin.from("product_groups").select("id, name, created_at").order("name"),
    product.group_id
      ? admin.from("products").select("id, name, slug, frame_type").eq("group_id", product.group_id)
      : Promise.resolve({ data: [] as GroupProduct[] }),
  ]);

  const catRel = product.category as { name?: string }[] | { name?: string } | null | undefined;
  const catName = Array.isArray(catRel) ? catRel[0]?.name : catRel?.name;
  const isWallArt = product.product_type === "wall_art";

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Products
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">{product.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              product.is_active
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-zinc-100 text-zinc-500 border border-zinc-200"
            }`}>
              {product.is_active ? "Active" : "Inactive"}
            </span>
            {product.is_featured && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Featured
              </span>
            )}
            {isWallArt && product.frame_type && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                {FRAME_TYPE_LABELS[product.frame_type as FrameType]}
              </span>
            )}
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              View on site <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* Product Info */}
          <Card title="Product Information">
            <form action={updateProductAction} className="space-y-4">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="productType" value={product.product_type} />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Product Name *</label>
                  <input name="name" defaultValue={product.name} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>URL Slug</label>
                  <input name="slug" defaultValue={product.slug} className={inputCls} />
                  <p className="text-[10px] text-zinc-400 mt-1">/products/<em>{product.slug}</em></p>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select name="categoryId" defaultValue={product.category_id ?? ""} className={inputCls}>
                    <option value="">None</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>SKU</label>
                  <input name="sku" defaultValue={product.sku ?? ""} placeholder="ALK-XXXXX" className={`${inputCls} font-mono`} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea name="description" rows={5} defaultValue={product.description ?? ""} className={textareaCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Tags <span className="font-normal text-zinc-400">(comma-separated)</span></label>
                  <input
                    name="tags"
                    defaultValue={(product.metadata?.tags as string) ?? ""}
                    placeholder="devotional, ganesh, gold, canvas"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* General product pricing */}
              {!isWallArt && (
                <div className="grid gap-4 md:grid-cols-3 pt-2 border-t border-zinc-100">
                  <div>
                    <label className={labelCls}>Price (₹)</label>
                    <input name="price" type="number" step="0.01" defaultValue={product.price / 100} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Compare At (₹)</label>
                    <input name="compareAtPrice" type="number" step="0.01" defaultValue={product.compare_at_price ? product.compare_at_price / 100 : ""} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Stock</label>
                    <input name="stockQuantity" type="number" defaultValue={product.stock_quantity} className={inputCls} />
                  </div>
                </div>
              )}

              {/* Physical attributes */}
              <div className="grid gap-4 md:grid-cols-3 pt-2 border-t border-zinc-100">
                <div>
                  <label className={labelCls}>Weight (grams)</label>
                  <input name="weightGrams" type="number" defaultValue={product.weight_grams ?? ""} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Material</label>
                  <input name="material" defaultValue={product.metadata?.material ?? ""} placeholder="e.g. Archival canvas" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Care Instructions</label>
                  <input name="care" defaultValue={product.metadata?.care ?? ""} placeholder="e.g. Wipe with dry cloth" className={inputCls} />
                </div>
              </div>

              {/* Visibility */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-zinc-100">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input name="isActive" type="checkbox" defaultChecked={product.is_active} className="h-4 w-4 rounded accent-indigo-600" />
                  Active (visible on site)
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input name="isFeatured" type="checkbox" defaultChecked={product.is_featured} className="h-4 w-4 rounded accent-indigo-600" />
                  Featured on homepage
                </label>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
                  Save Product
                </button>
              </div>
            </form>
          </Card>

          {/* Images */}
          <Card title="Images" subtitle="Featured image shown on cards; gallery images shown in the product page slideshow.">
            <EditProductImages
              productId={product.id}
              initialImages={product.images ?? []}
              frameType={product.frame_type ?? "misc"}
            />
          </Card>

          {/* Wall art: variants */}
          {isWallArt && variants && variants.length > 0 && (
            <Card title="Size Variants" subtitle="Pricing, SKU, stock, and active state per size.">
              <div className="space-y-2">
                {variants.map((v: {
                  id: string; frame_type: FrameType; size: FrameSize;
                  sku: string | null; price: number; compare_at_price: number | null;
                  stock_quantity: number; is_active: boolean; images: string[];
                }) => (
                  <form key={v.id} action={updateProductVariantAction} className="grid grid-cols-[90px_1fr_1fr_1fr_60px_60px_auto] items-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors">
                    <input type="hidden" name="variantId" value={v.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{FRAME_SIZE_LABELS[v.size]}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{formatINR(v.price)}</p>
                    </div>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={v.price / 100}
                      placeholder="Price ₹"
                      className="h-8 px-2 rounded-md border border-zinc-200 bg-white text-xs text-right text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      name="compareAtPrice"
                      type="number"
                      step="0.01"
                      defaultValue={v.compare_at_price ? v.compare_at_price / 100 : ""}
                      placeholder="Compare ₹"
                      className="h-8 px-2 rounded-md border border-zinc-200 bg-white text-xs text-right text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      name="sku"
                      defaultValue={v.sku ?? ""}
                      placeholder="SKU"
                      className="h-8 px-2 rounded-md border border-zinc-200 bg-white text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      name="stockQuantity"
                      type="number"
                      defaultValue={v.stock_quantity}
                      placeholder="Qty"
                      className="h-8 px-2 rounded-md border border-zinc-200 bg-white text-xs text-center text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <label className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 cursor-pointer">
                      <input name="isActive" type="checkbox" defaultChecked={v.is_active} className="h-3 w-3 rounded accent-indigo-600" />
                      On
                    </label>
                    <button type="submit" className="h-8 px-3 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md transition-colors whitespace-nowrap">
                      Save
                    </button>
                  </form>
                ))}
              </div>
            </Card>
          )}

          {/* Wall art: product group */}
          {isWallArt && (
            <Card title="Product Group" subtitle="Group canvas / acrylic / wooden variants so customers can switch frame types on the storefront.">
              <ProductGroupPanel
                productId={product.id}
                currentGroupId={product.group_id ?? null}
                currentGroupName={allGroups?.find((g: ProductGroup) => g.id === product.group_id)?.name ?? null}
                groupMembers={(groupMembers as GroupProduct[]) ?? []}
                allGroups={(allGroups as ProductGroup[]) ?? []}
              />
            </Card>
          )}

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="space-y-5">

          {/* Summary */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Summary</h2>
            <dl className="space-y-2.5 text-sm">
              {[
                { label: "Type", value: isWallArt ? "Wall Art" : "General" },
                { label: "Category", value: catName || "—" },
                { label: "Status", value: product.is_active ? "Active" : "Inactive" },
                { label: "Frame", value: product.frame_type ? FRAME_TYPE_LABELS[product.frame_type as FrameType] : "—" },
                { label: "Group", value: allGroups?.find((g: ProductGroup) => g.id === product.group_id)?.name ?? "—" },
                { label: "Variants", value: variants?.length ?? 0 },
                { label: "Created", value: new Date(product.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                { label: "Updated", value: new Date(product.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <dt className="text-zinc-500">{row.label}</dt>
                  <dd className="font-medium text-zinc-900 text-right">{String(row.value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Quick image preview */}
          {(product.images ?? []).length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">Current Images</h2>
              <div className="grid grid-cols-3 gap-1.5">
                {product.images.slice(0, 6).map((img: string, i: number) => (
                  <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-md bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                        <span className="text-[8px] bg-black/50 text-white px-1 py-0.5 rounded">Cover</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {product.images.length > 6 && (
                <p className="text-xs text-zinc-400 mt-2">+{product.images.length - 6} more</p>
              )}
            </div>
          )}

          {/* Danger zone */}
          <div className="bg-white border border-red-100 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">Danger Zone</h2>
            <p className="text-xs text-zinc-500 mb-4">Permanently deletes this product and all its variants.</p>
            <DeleteProductButton productId={product.id} />
          </div>

        </aside>
      </div>
    </div>
  );
}
