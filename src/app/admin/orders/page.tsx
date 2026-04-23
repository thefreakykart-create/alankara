import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Orders — Alankara Admin",
};

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

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, user_id, status, total, shipping_address, created_at")
    .order("created_at", { ascending: false });

  const userIds = Array.from(new Set((orders ?? []).map((o) => o.user_id)));
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const pendingCount =
    orders?.filter((o) =>
      ["pending", "confirmed", "processing", "shipped"].includes(o.status)
    ).length ?? 0;
  const deliveredCount = orders?.filter((o) => o.status === "delivered").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Orders</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Monitor every order and update fulfillment status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: orders?.length ?? 0 },
          { label: "In Fulfillment", value: pendingCount },
          { label: "Delivered", value: deliveredCount },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-4">
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-zinc-900 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {orders && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((order) => {
                  const addr = order.shipping_address as {
                    fullName?: string;
                    city?: string;
                    state?: string;
                  } | null;
                  const name =
                    profileMap.get(order.user_id)?.full_name ||
                    addr?.fullName ||
                    "Customer";

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-zinc-900 hover:text-indigo-600 transition-colors"
                        >
                          {order.order_number}
                        </Link>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-zinc-900">{name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {[addr?.city, addr?.state].filter(Boolean).join(", ") || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(order.status)}`}>
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-zinc-900 tabular-nums">
                        {formatINR(order.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-zinc-400">No orders yet.</div>
        )}
      </div>
    </div>
  );
}
