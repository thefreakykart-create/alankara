import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PHONEPE_CONFIG } from "@/lib/phonepe/config";
import {
  PINCODE_REGEX,
  SHIPPING_RATES,
} from "@/lib/constants";
import {
  FRAME_TYPE_LABELS,
  type FrameType,
} from "@/lib/types/product";
import type { CartItem } from "@/lib/types/cart";

// Use service role for order creation (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CheckoutPayload {
  userId?: string;
  items?: CartItem[];
  shippingAddress?: Record<string, unknown>;
}

function normalizeShippingAddress(shippingAddress: Record<string, unknown>) {
  const normalized = {
    fullName: String(shippingAddress.fullName ?? "").trim(),
    phone: String(shippingAddress.phone ?? "").replace(/\D/g, "").slice(0, 10),
    addressLine1: String(shippingAddress.addressLine1 ?? "").trim(),
    addressLine2: String(shippingAddress.addressLine2 ?? "").trim(),
    city: String(shippingAddress.city ?? "").trim(),
    state: String(shippingAddress.state ?? "").trim(),
    pincode: String(shippingAddress.pincode ?? "").replace(/\D/g, "").slice(0, 6),
    landmark: String(shippingAddress.landmark ?? "").trim(),
  };

  const isValid =
    normalized.fullName &&
    normalized.phone.length === 10 &&
    normalized.addressLine1 &&
    normalized.city &&
    normalized.state &&
    PINCODE_REGEX.test(normalized.pincode);

  return isValid ? normalized : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutPayload;
    const { userId, items, shippingAddress } = body;

    if (
      !userId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !shippingAddress ||
      typeof shippingAddress !== "object"
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: Number(item.quantity),
    }));

    if (
      normalizedItems.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0
      )
    ) {
      return NextResponse.json(
        { error: "Invalid cart items" },
        { status: 400 }
      );
    }

    const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);

    if (!normalizedShippingAddress) {
      return NextResponse.json(
        { error: "Invalid shipping address" },
        { status: 400 }
      );
    }

    const variantIds = Array.from(
      new Set(
        normalizedItems
          .map((item) => item.variantId)
          .filter((variantId): variantId is string => Boolean(variantId))
      )
    );
    const directProductIds = Array.from(
      new Set(
        normalizedItems
          .filter((item) => !item.variantId)
          .map((item) => item.productId)
      )
    );

    const { data: variantRecords, error: variantError } =
      variantIds.length > 0
        ? await supabase
            .from("product_variants")
            .select(
              "id, product_id, frame_type, size, price, stock_quantity, is_active, images"
            )
            .in("id", variantIds)
        : { data: [], error: null };

    if (variantError) throw variantError;

    const productIds = Array.from(
      new Set([
        ...directProductIds,
        ...(variantRecords ?? []).map((variant) => variant.product_id),
      ])
    );

    const { data: productRecords, error: productError } =
      productIds.length > 0
        ? await supabase
            .from("products")
            .select(
              "id, name, slug, product_type, price, stock_quantity, is_active, images"
            )
            .in("id", productIds)
        : { data: [], error: null };

    if (productError) throw productError;

    const productMap = new Map(
      (productRecords ?? []).map((product) => [product.id, product])
    );
    const variantMap = new Map(
      (variantRecords ?? []).map((variant) => [variant.id, variant])
    );

    const computedOrderItems = normalizedItems.map((item) => {
      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        const product = productMap.get(item.productId);

        if (
          !variant ||
          !product ||
          variant.product_id !== product.id ||
          !variant.is_active ||
          !product.is_active
        ) {
          throw new Error("One or more wall art variants are unavailable");
        }

        if (item.quantity > variant.stock_quantity) {
          throw new Error(`Not enough stock for ${product.name}`);
        }

        return {
          productId: product.id,
          productName: `${product.name} — ${
            FRAME_TYPE_LABELS[variant.frame_type as FrameType]
          }`,
          productImage: variant.images?.[0] || product.images?.[0] || null,
          quantity: item.quantity,
          unitPrice: variant.price,
        };
      }

      const product = productMap.get(item.productId);

      if (!product || !product.is_active) {
        throw new Error("One or more products are unavailable");
      }

      if (product.product_type === "wall_art") {
        throw new Error("Wall art products must be ordered with a variant");
      }

      if (item.quantity > product.stock_quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      return {
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || null,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    const subtotal = computedOrderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const shippingCost =
      subtotal >= SHIPPING_RATES.freeAbove ? 0 : SHIPPING_RATES.standard;
    const total = subtotal + shippingCost;

    // Generate order number: ALK-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderNumber = `ALK-${dateStr}-${rand}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        status: "pending",
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_address: normalizedShippingAddress,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = computedOrderItems.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_image: item.productImage,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
      }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) throw orderItemsError;

    // Generate merchant transaction ID
    const merchantTransactionId = `ALK_${Date.now()}_${rand}`;

    // Create payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      phonepe_merchant_transaction_id: merchantTransactionId,
      amount: total,
      status: "initiated",
    });

    if (paymentError) throw paymentError;

    // If PhonePe is not configured, simulate success
    if (!PHONEPE_CONFIG.merchantId || !PHONEPE_CONFIG.saltKey) {
      // Update order and payment to success (demo mode)
      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", order.id);

      await supabase
        .from("payments")
        .update({ status: "success", payment_method: "demo" })
        .eq("order_id", order.id);

      // Add initial tracking
      await supabase.from("order_tracking").insert({
        order_id: order.id,
        status: "confirmed",
        description: "Order confirmed and payment received",
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber,
        demo: true,
      });
    }

    // Build PhonePe payload
    const origin = new URL(request.url).origin;
    const payload = {
      merchantId: PHONEPE_CONFIG.merchantId,
      merchantTransactionId,
      merchantUserId: userId,
      amount: total, // in paise
      redirectUrl: `${origin}/checkout/success?orderId=${order.id}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${origin}/api/phonepe/callback`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );
    const checksum =
      crypto
        .createHash("sha256")
        .update(base64Payload + "/pg/v1/pay" + PHONEPE_CONFIG.saltKey)
        .digest("hex") +
      "###" +
      PHONEPE_CONFIG.saltIndex;

    // Call PhonePe
    const response = await fetch(`${PHONEPE_CONFIG.baseUrl}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      return NextResponse.json({
        success: true,
        redirectUrl: data.data.instrumentResponse.redirectInfo.url,
        orderId: order.id,
        orderNumber,
      });
    }

    return NextResponse.json(
      { error: "Payment initiation failed", details: data },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error("PhonePe initiate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
