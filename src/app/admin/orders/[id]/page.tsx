import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdminOrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Manage Order ${id} — Alankara Admin`,
  };
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const [{ data: items }, { data: payment }, { data: tracking }, { data: profile }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id),
      supabase
        .from("payments")
        .select("*")
        .eq("order_id", id)
        .maybeSingle(),
      supabase
        .from("order_tracking")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", order.user_id)
        .maybeSingle(),
    ]);

  const shippingAddress = order.shipping_address as {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
            Order Detail
          </p>
          <h2 className="mt-1 font-serif text-3xl text-charcoal">
            {order.order_number}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 rounded-sm border border-charcoal px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-charcoal transition-colors hover:bg-charcoal hover:text-warm-white"
        >
          Back to Orders
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-charcoal">Items</h3>
                <p className="text-sm text-muted">
                  All products included in this order.
                </p>
              </div>
              <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-charcoal">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-sm border border-border px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-charcoal">{item.product_name}</p>
                    <p className="mt-1 text-xs text-muted">
                      Qty {item.quantity} · {formatINR(item.unit_price)} each
                    </p>
                  </div>
                  <span className="font-medium text-charcoal">
                    {formatINR(item.total_price)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="text-charcoal">{formatINR(order.subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted">Shipping</span>
                <span className="text-charcoal">
                  {formatINR(order.shipping_cost)}
                </span>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-medium">
                <span className="text-charcoal">Total</span>
                <span className="text-charcoal">{formatINR(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
            <h3 className="font-medium text-charcoal">Tracking Timeline</h3>
            <div className="mt-4 space-y-4">
              {tracking && tracking.length > 0 ? (
                tracking.map((entry) => (
                  <div key={entry.id} className="border-l border-border pl-4">
                    <p className="text-sm font-medium text-charcoal">
                      {ORDER_STATUS_LABELS[entry.status] ?? entry.status}
                    </p>
                    {entry.description && (
                      <p className="mt-1 text-sm text-muted">
                        {entry.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {new Date(entry.created_at).toLocaleString("en-IN")}
                    </p>
                    {(entry.courier_name || entry.tracking_number) && (
                      <p className="mt-1 text-xs text-muted">
                        {[entry.courier_name, entry.tracking_number]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No tracking events yet.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
            <h3 className="font-medium text-charcoal">Update Fulfillment</h3>
            <form action={updateOrderStatusAction} className="mt-4 space-y-4">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={order.status}
                  className="h-11 w-full rounded-sm border border-border bg-transparent px-3 text-sm focus:border-charcoal focus:outline-none"
                >
                  {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Courier Name
                </span>
                <input
                  name="courierName"
                  className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Tracking Number
                </span>
                <input
                  name="trackingNumber"
                  className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Note
                </span>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="What changed for this order?"
                  className="w-full rounded-sm border border-border px-3 py-3 text-sm focus:border-charcoal focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="rounded-sm bg-charcoal px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-warm-white transition-colors hover:bg-terracotta"
              >
                Save Update
              </button>
            </form>
          </section>

          <section className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
            <h3 className="font-medium text-charcoal">Customer & Shipping</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Customer
                </p>
                <p className="mt-1 font-medium text-charcoal">
                  {shippingAddress?.fullName || profile?.full_name || "Customer"}
                </p>
                <p className="mt-1 text-muted">
                  {shippingAddress?.phone || profile?.phone || "No phone"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Address
                </p>
                <p className="mt-1 text-charcoal">
                  {[
                    shippingAddress?.addressLine1,
                    shippingAddress?.addressLine2,
                    shippingAddress?.landmark,
                    shippingAddress?.city,
                    shippingAddress?.state,
                    shippingAddress?.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No address stored"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
            <h3 className="font-medium text-charcoal">Payment</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted">Status</span>
                <span className="font-medium text-charcoal">
                  {payment?.status || "Pending"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Method</span>
                <span className="font-medium text-charcoal">
                  {payment?.payment_method || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Amount</span>
                <span className="font-medium text-charcoal">
                  {payment ? formatINR(payment.amount) : formatINR(order.total)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Merchant Txn</span>
                <span className="max-w-[180px] text-right font-medium text-charcoal">
                  {payment?.phonepe_merchant_transaction_id || "—"}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
