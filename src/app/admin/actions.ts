"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateSlug } from "@/lib/utils";
import { createAdminServiceClient, requireAdmin } from "@/lib/admin";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus, Profile } from "@/lib/types/order";

function parseCheckbox(value: FormDataEntryValue | null) {
  return value === "on";
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePriceToPaise(value: FormDataEntryValue | null) {
  const amount = parseOptionalNumber(value);
  return amount === null ? null : Math.round(amount * 100);
}

function parseText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseIntValue(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const id = parseText(formData.get("id"));
  const name = parseText(formData.get("name"));
  const slugInput = parseText(formData.get("slug"));

  if (!name) {
    throw new Error("Category name is required.");
  }

  const payload = {
    name,
    slug: slugInput || generateSlug(name),
    description: parseText(formData.get("description")),
    image_url: parseText(formData.get("imageUrl")),
    display_order: parseIntValue(formData.get("displayOrder"), 0),
  };

  if (id) {
    const { error } = await admin
      .from("categories")
      .update(payload)
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("categories").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function updateProfileRoleAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const profileId = parseText(formData.get("profileId"));
  const role = parseText(formData.get("role")) as Profile["role"] | null;

  if (!profileId || (role !== "admin" && role !== "customer")) {
    throw new Error("Invalid profile update request.");
  }

  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/customers");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const productId = parseText(formData.get("productId"));
  const name = parseText(formData.get("name"));
  const slugInput = parseText(formData.get("slug"));
  const productType = parseText(formData.get("productType"));

  if (!productId || !name || !productType) {
    throw new Error("Missing product fields.");
  }

  const metadata = {
    material: parseText(formData.get("material")),
    care: parseText(formData.get("care")),
  };

  const cleanedMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => Boolean(value))
  );

  const imageUrls = String(formData.get("imageUrls") ?? "")
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);

  const payload = {
    name,
    slug: slugInput || generateSlug(name),
    description: parseText(formData.get("description")),
    category_id: parseText(formData.get("categoryId")),
    sku: parseText(formData.get("sku")),
    is_active: parseCheckbox(formData.get("isActive")),
    is_featured: parseCheckbox(formData.get("isFeatured")),
    weight_grams: parseOptionalNumber(formData.get("weightGrams")),
    metadata:
      Object.keys(cleanedMetadata).length > 0
        ? cleanedMetadata
        : null,
    images: imageUrls,
    ...(productType === "general"
      ? {
          price: parsePriceToPaise(formData.get("price")) ?? 0,
          compare_at_price: parsePriceToPaise(formData.get("compareAtPrice")),
          stock_quantity: parseIntValue(formData.get("stockQuantity"), 0),
        }
      : {}),
  };

  const { error } = await admin
    .from("products")
    .update(payload)
    .eq("id", productId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
}

export async function updateProductVariantAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const variantId = parseText(formData.get("variantId"));
  const productId = parseText(formData.get("productId"));

  if (!variantId || !productId) {
    throw new Error("Missing variant fields.");
  }

  const { error } = await admin
    .from("product_variants")
    .update({
      price: parsePriceToPaise(formData.get("price")) ?? 0,
      compare_at_price: parsePriceToPaise(formData.get("compareAtPrice")),
      sku: parseText(formData.get("sku")),
      stock_quantity: parseIntValue(formData.get("stockQuantity"), 0),
      is_active: parseCheckbox(formData.get("isActive")),
    })
    .eq("id", variantId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/planner");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const orderId = parseText(formData.get("orderId"));
  const status = parseText(formData.get("status")) as OrderStatus | null;
  const description = parseText(formData.get("description"));
  const trackingNumber = parseText(formData.get("trackingNumber"));
  const courierName = parseText(formData.get("courierName"));

  if (
    !orderId ||
    !status ||
    ![
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ].includes(status)
  ) {
    throw new Error("Invalid order status update.");
  }

  const { error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  const { error: trackingError } = await admin.from("order_tracking").insert({
    order_id: orderId,
    status,
    description:
      description ||
      `Status updated to ${ORDER_STATUS_LABELS[status] ?? status}`,
    tracking_number: trackingNumber,
    courier_name: courierName,
  });

  if (trackingError) throw new Error(trackingError.message);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account");
}

// ─── Product toggle (active / featured) ───────────────────────────────────────

export async function toggleProductFieldAction(
  productId: string,
  field: "is_active" | "is_featured",
  value: boolean
) {
  await requireAdmin();
  const admin = createAdminServiceClient();
  const { error } = await admin
    .from("products")
    .update({ [field]: value })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}

// ─── Delete product ────────────────────────────────────────────────────────────

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();
  const productId = parseText(formData.get("productId"));
  if (!productId) throw new Error("Missing productId.");

  // Delete variants first (FK)
  await admin.from("product_variants").delete().eq("product_id", productId);
  const { error } = await admin.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/admin");
  redirect("/admin/products");
}

// ─── Variant images ────────────────────────────────────────────────────────────

export async function updateVariantImagesAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();
  const variantId = parseText(formData.get("variantId"));
  const productId = parseText(formData.get("productId"));
  const imageUrls = String(formData.get("imageUrls") ?? "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  if (!variantId || !productId) throw new Error("Missing fields.");
  const { error } = await admin
    .from("product_variants")
    .update({ images: imageUrls })
    .eq("id", variantId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
}

// ─── Coupons ───────────────────────────────────────────────────────────────────

export async function createCouponAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const code = parseText(formData.get("code"))?.toUpperCase();
  const type = parseText(formData.get("type")) as "percentage" | "fixed" | null;
  const value = parseIntValue(formData.get("value"), 0);
  const minOrderAmount = parsePriceToPaise(formData.get("minOrderAmount")) ?? 0;
  const maxUses = parseOptionalNumber(formData.get("maxUses"));
  const expiresAt = parseText(formData.get("expiresAt"));

  if (!code || !type) throw new Error("Code and type are required.");
  const finalValue = type === "fixed" ? Math.round(value * 100) : value;

  const { error } = await admin.from("coupons").insert({
    code,
    type,
    value: finalValue,
    min_order_amount: minOrderAmount,
    max_uses: maxUses,
    expires_at: expiresAt || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
}

export async function toggleCouponAction(couponId: string, isActive: boolean) {
  await requireAdmin();
  const admin = createAdminServiceClient();
  const { error } = await admin
    .from("coupons")
    .update({ is_active: isActive })
    .eq("id", couponId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();
  const couponId = parseText(formData.get("couponId"));
  if (!couponId) throw new Error("Missing couponId.");
  const { error } = await admin.from("coupons").delete().eq("id", couponId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
}

// ─── Site settings ─────────────────────────────────────────────────────────────

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const store = {
    name: parseText(formData.get("storeName")) ?? "Alankara",
    tagline: parseText(formData.get("tagline")) ?? "",
    email: parseText(formData.get("email")) ?? "",
    phone: parseText(formData.get("phone")) ?? "",
    address: parseText(formData.get("address")) ?? "",
    instagram: parseText(formData.get("instagram")) ?? "",
    facebook: parseText(formData.get("facebook")) ?? "",
    twitter: parseText(formData.get("twitter")) ?? "",
  };

  const announcement = {
    text: parseText(formData.get("announcementText")) ?? "",
    link: parseText(formData.get("announcementLink")) ?? "",
    is_active: parseCheckbox(formData.get("announcementActive")),
    bg_color: parseText(formData.get("announcementBg")) ?? "#1a1a1a",
    text_color: parseText(formData.get("announcementTextColor")) ?? "#ffffff",
  };

  await Promise.all([
    admin
      .from("site_settings")
      .upsert({ key: "store", value: store, updated_at: new Date().toISOString() }),
    admin
      .from("site_settings")
      .upsert({ key: "announcement", value: announcement, updated_at: new Date().toISOString() }),
  ]);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

// ─── Product groups ────────────────────────────────────────────────────────────

export async function createProductGroupAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const productId = parseText(formData.get("productId"));
  const groupName = parseText(formData.get("groupName"));
  if (!productId || !groupName) throw new Error("Missing fields.");

  const { data: group, error: groupError } = await admin
    .from("product_groups")
    .insert({ name: groupName })
    .select("id")
    .single();
  if (groupError) throw new Error(groupError.message);

  const { error } = await admin
    .from("products")
    .update({ group_id: group.id })
    .eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
}

export async function joinProductGroupAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const productId = parseText(formData.get("productId"));
  const groupId = parseText(formData.get("groupId"));
  if (!productId || !groupId) throw new Error("Missing fields.");

  const { error } = await admin
    .from("products")
    .update({ group_id: groupId })
    .eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
}

export async function removeFromGroupAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const productId = parseText(formData.get("productId"));
  if (!productId) throw new Error("Missing productId.");

  const { error } = await admin
    .from("products")
    .update({ group_id: null })
    .eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/products/${productId}`);
}

// ─── Publish wall art ──────────────────────────────────────────────────────────

export interface VariantPayload {
  frame_type: string;
  size: string;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock_quantity: number;
  images: string[];
}

export interface PublishWallArtPayload {
  name: string;
  slug: string;
  description: string;
  category_id: string;
  is_featured: boolean;
  variants: VariantPayload[];
}

export async function publishWallArtAction(payload: PublishWallArtPayload): Promise<string> {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      product_type: "wall_art",
      price: 0,
      category_id: payload.category_id,
      images: [],
      stock_quantity: 0,
      is_active: true,
      is_featured: payload.is_featured,
    })
    .select("id")
    .single();

  if (productError) throw new Error(productError.message);

  const variantRows = payload.variants.map((v) => ({
    product_id: product.id,
    frame_type: v.frame_type,
    size: v.size,
    price: v.price,
    compare_at_price: v.compare_at_price,
    sku: v.sku,
    stock_quantity: v.stock_quantity,
    images: v.images,
    is_active: true,
  }));

  const { error: variantError } = await admin
    .from("product_variants")
    .insert(variantRows);

  if (variantError) throw new Error(variantError.message);

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");

  return product.id;
}

export interface SingleFrameVariantPayload {
  size: string;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock_quantity: number;
  images: string[];
}

export interface PublishSingleFramePayload {
  name: string;
  slug: string;
  description: string;
  category_id: string;
  frame_type: string;
  is_featured: boolean;
  variants: SingleFrameVariantPayload[];
}

export async function publishSingleFrameProductAction(
  payload: PublishSingleFramePayload
): Promise<string> {
  await requireAdmin();
  const admin = createAdminServiceClient();

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      product_type: "wall_art",
      frame_type: payload.frame_type,
      price: 0,
      category_id: payload.category_id,
      images: [],
      stock_quantity: 0,
      is_active: true,
      is_featured: payload.is_featured,
    })
    .select("id")
    .single();

  if (productError) throw new Error(productError.message);

  const variantRows = payload.variants.map((v) => ({
    product_id: product.id,
    frame_type: payload.frame_type,
    size: v.size,
    price: v.price,
    compare_at_price: v.compare_at_price,
    sku: v.sku,
    stock_quantity: v.stock_quantity,
    images: v.images,
    is_active: true,
  }));

  const { error: variantError } = await admin
    .from("product_variants")
    .insert(variantRows);
  if (variantError) throw new Error(variantError.message);

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");

  return product.id;
}
