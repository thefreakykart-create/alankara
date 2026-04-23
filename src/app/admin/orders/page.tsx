import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Manage Orders — Alankara Admin",
};

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, user_id, status, total, shipping_address, created_at")
    .order("created_at", { ascending: false });

  const userIds = Array.from(new Set((orders ?? []).map((order) => order.user_id)));
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)
      : { data: [] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const pendingCount =
    orders?.filter((order) =>
      ["pending", "confirmed", "processing", "shipped"].includes(order.status)
    ).length ?? 0;
  const deliveredCount =
    orders?.filter((order) => order.status === "delivered").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
          Fulfillment
        </p>
        <h2 className="mt-1 font-serif text-3xl text-charcoal">Orders</h2>
        <p className="mt-2 text-sm text-muted">
          Monitor every order, review customer details, and update fulfillment
          status with tracking notes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Total Orders
          </p>
          <p className="mt-3 font-serif text-3xl text-charcoal">
            {orders?.length ?? 0}
          </p>
        </div>
        <div className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            In Fulfillment
          </p>
          <p className="mt-3 font-serif text-3xl text-charcoal">{pendingCount}</p>
        </div>
        <div className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Delivered
          </p>
          <p className="mt-3 font-serif text-3xl text-charcoal">
            {deliveredCount}
          </p>
        </div>
      </div>

      {orders && orders.length > 0 ? (
        <div className="overflow-hidden rounded-sm border border-border bg-warm-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/40">
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                    Order
                  </th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs uppercase tracking-[0.16em] text-muted">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const shippingAddress = order.shipping_address as {
                    fullName?: string;
                    city?: string;
                    state?: string;
                  } | null;
                  const customerName =
                    profileMap.get(order.user_id)?.full_name ||
                    shippingAddress?.fullName ||
                    "Customer";

                  return (
                    <tr key={order.id} className="border-b border-border/70">
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-charcoal hover:text-terracotta"
                        >
                          {order.order_number}
                        </Link>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-charcoal">{customerName}</p>
                        <p className="mt-1 text-xs text-muted">
                          {[shippingAddress?.city, shippingAddress?.state]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-charcoal">
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-charcoal">
                        {formatINR(order.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-warm-white p-8 text-center text-sm text-muted shadow-sm">
          No orders yet.
        </div>
      )}
    </div>
  );
}
