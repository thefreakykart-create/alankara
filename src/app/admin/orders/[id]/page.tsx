import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id} — Alankara Admin` };
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
    processing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    shipped: "bg-purple-50 text-purple-700 border border-purple-200",
    delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border border-red-200",
    refunded: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  };
  return map[status] ?? "bg-zinc-100 text-zinc-600 border border-zinc-200";
}

const inputCls =
  "w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

export default async function AdminOrderDetailPage({ params }: Props) {
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
      supabase.from("order_items").select("*").eq("order_id", id),
      supabase.from("payments").select("*").eq("order_id", id).maybeSingle(),
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

  const addr = order.shipping_address as {
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">{order.order_number}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Placed{" "}
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusClass(order.status)}`}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Items */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">Order Items</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {items?.map((item) => (
                <div key={item.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{item.product_name}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Qty {item.quantity} · {formatINR(item.unit_price)} each
                    </p>
                  </div>
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {formatINR(item.total_price)}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-zinc-100 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="text-zinc-900 tabular-nums">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Shipping</span>
                <span className="text-zinc-900 tabular-nums">{formatINR(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between font-semibold text-zinc-900 pt-2 border-t border-zinc-100">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Tracking timeline */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Tracking Timeline</h2>
            {tracking && tracking.length > 0 ? (
              <div className="space-y-4">
                {tracking.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full flex-none mt-1 ${i === 0 ? "bg-indigo-600" : "bg-zinc-300"}`} />
                      {i < tracking.length - 1 && (
                        <div className="w-px flex-1 bg-zinc-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-zinc-900">
                        {ORDER_STATUS_LABELS[entry.status] ?? entry.status}
                      </p>
                      {entry.description && (
                        <p className="mt-0.5 text-sm text-zinc-500">{entry.description}</p>
                      )}
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {new Date(entry.created_at).toLocaleString("en-IN")}
                      </p>
                      {(entry.courier_name || entry.tracking_number) && (
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {[entry.courier_name, entry.tracking_number].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No tracking events yet.</p>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          {/* Update fulfillment */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Update Fulfillment</h2>
            <form action={updateOrderStatusAction} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <label className={labelCls}>Status</label>
                <select
                  name="status"
                  defaultValue={order.status}
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Courier Name</label>
                <input name="courierName" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tracking Number</label>
                <input name="trackingNumber" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Note</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="What changed for this order?"
                  className="w-full px-3 py-2.5 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Save Update
              </button>
            </form>
          </div>

          {/* Customer & Shipping */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Customer & Shipping</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1">Customer</p>
                <p className="font-medium text-zinc-900">
                  {addr?.fullName || profile?.full_name || "Customer"}
                </p>
                <p className="text-zinc-500">
                  {addr?.phone || profile?.phone || "No phone"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1">Delivery Address</p>
                <p className="text-zinc-700 leading-relaxed">
                  {[
                    addr?.addressLine1,
                    addr?.addressLine2,
                    addr?.landmark,
                    addr?.city,
                    addr?.state,
                    addr?.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "No address stored"}
                </p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Payment</h2>
            <div className="space-y-2.5 text-sm">
              {[
                { label: "Status", value: payment?.status || "Pending" },
                { label: "Method", value: payment?.payment_method || "—" },
                {
                  label: "Amount",
                  value: payment ? formatINR(payment.amount) : formatINR(order.total),
                },
                {
                  label: "Txn ID",
                  value: payment?.phonepe_merchant_transaction_id || "—",
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <span className="text-zinc-500">{row.label}</span>
                  <span className="font-medium text-zinc-900 text-right truncate max-w-[180px]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
