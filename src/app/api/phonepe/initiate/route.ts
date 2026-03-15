import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PHONEPE_CONFIG } from "@/lib/phonepe/config";

// Use service role for order creation (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, items, shippingAddress, subtotal, shippingCost, total } =
      await request.json();

    if (!userId || !items?.length || !shippingAddress || !total) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(
      (item: {
        productId: string;
        name: string;
        image: string;
        quantity: number;
        price: number;
      }) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      })
    );

    await supabase.from("order_items").insert(orderItems);

    // Generate merchant transaction ID
    const merchantTransactionId = `ALK_${Date.now()}_${rand}`;

    // Create payment record
    await supabase.from("payments").insert({
      order_id: order.id,
      phonepe_merchant_transaction_id: merchantTransactionId,
      amount: total,
      status: "initiated",
    });

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
    const payload = {
      merchantId: PHONEPE_CONFIG.merchantId,
      merchantTransactionId,
      merchantUserId: userId,
      amount: total, // in paise
      redirectUrl: `${request.headers.get("origin")}/checkout/success?orderId=${order.id}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${request.headers.get("origin")}/api/phonepe/callback`,
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
