import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { PHONEPE_CONFIG } from "@/lib/phonepe/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { response: encodedResponse } = body;

    if (!encodedResponse) {
      return NextResponse.json({ error: "Missing response" }, { status: 400 });
    }

    // Verify checksum
    const xVerifyHeader =
      crypto
        .createHash("sha256")
        .update(encodedResponse + PHONEPE_CONFIG.saltKey)
        .digest("hex") +
      "###" +
      PHONEPE_CONFIG.saltIndex;

    const receivedChecksum = request.headers.get("X-VERIFY");

    if (xVerifyHeader !== receivedChecksum) {
      console.error("Checksum mismatch");
      return NextResponse.json(
        { error: "Checksum verification failed" },
        { status: 400 }
      );
    }

    // Decode response
    const decodedResponse = JSON.parse(
      Buffer.from(encodedResponse, "base64").toString("utf-8")
    );

    const merchantTransactionId =
      decodedResponse.data?.merchantTransactionId;
    const transactionId = decodedResponse.data?.transactionId;
    const paymentStatus = decodedResponse.code === "PAYMENT_SUCCESS"
      ? "success"
      : "failed";

    // Update payment
    const { data: payment } = await supabase
      .from("payments")
      .update({
        phonepe_transaction_id: transactionId,
        status: paymentStatus,
        payment_method: decodedResponse.data?.paymentInstrument?.type || "unknown",
        raw_response: decodedResponse,
      })
      .eq("phonepe_merchant_transaction_id", merchantTransactionId)
      .select("order_id")
      .single();

    if (payment) {
      // Update order status
      const orderStatus = paymentStatus === "success" ? "confirmed" : "pending";
      await supabase
        .from("orders")
        .update({ status: orderStatus })
        .eq("id", payment.order_id);

      if (paymentStatus === "success") {
        await supabase.from("order_tracking").insert({
          order_id: payment.order_id,
          status: "confirmed",
          description: "Payment received, order confirmed",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("PhonePe callback error:", error);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 }
    );
  }
}
