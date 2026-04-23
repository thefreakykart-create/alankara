"use server";

import { revalidatePath } from "next/cache";
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
