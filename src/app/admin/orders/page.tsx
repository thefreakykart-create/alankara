import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";
import OrdersTable from "@/components/admin/orders-table";

export const metadata: Metadata = { title: "Orders — Alankara Admin" };

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

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const pendingCount =
    orders?.filter((o) => ["pending", "confirmed", "processing", "shipped"].includes(o.status)).length ?? 0;
  const deliveredCount = orders?.filter((o) => o.status === "delivered").length ?? 0;
  const revenue = orders?.reduce((sum, o) =>
    o.status === "cancelled" || o.status === "refunded" ? sum : sum + o.total, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Orders</h1>
        <p className="mt-1 text-sm text-zinc-500">Monitor every order and update fulfillment status.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: String(orders?.length ?? 0) },
          { label: "In Fulfillment", value: String(pendingCount) },
          { label: "Delivered", value: String(deliveredCount) },
          { label: "Revenue", value: formatINR(revenue) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-4">
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-zinc-900 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <OrdersTable orders={orders ?? []} profileMap={profileMap} />
    </div>
  );
}
