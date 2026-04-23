import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Analytics — Alankara Admin" };

function monthKey(date: string) {
  return date.slice(0, 7); // "2025-04"
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-400",
    confirmed: "bg-blue-400",
    processing: "bg-indigo-400",
    shipped: "bg-purple-400",
    delivered: "bg-emerald-500",
    cancelled: "bg-red-400",
    refunded: "bg-zinc-400",
  };
  return map[status] ?? "bg-zinc-400";
}

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin();

  const [
    { data: orders },
    { data: orderItems },
    { data: productCount },
    { data: customerCount },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, status, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("order_items")
      .select("product_id, product_name, quantity, total_price"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
  ]);

  // Revenue & order stats
  const validOrders = (orders ?? []).filter(
    (o) => o.status !== "cancelled" && o.status !== "refunded"
  );
  const totalRevenue = validOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders?.length ?? 0;
  const avgOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  // This month vs last month
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthRevenue = validOrders
    .filter((o) => monthKey(o.created_at) === thisMonthKey)
    .reduce((s, o) => s + o.total, 0);
  const lastMonthRevenue = validOrders
    .filter((o) => monthKey(o.created_at) === lastMonthKey)
    .reduce((s, o) => s + o.total, 0);
  const revenueChange =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : null;

  // Monthly revenue — last 6 months
  const last6Months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const monthlyRevenue = last6Months.map((mk) => ({
    label: monthLabel(mk),
    value: validOrders
      .filter((o) => monthKey(o.created_at) === mk)
      .reduce((s, o) => s + o.total, 0),
  }));
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.value), 1);

  // Orders by status
  const statusCounts: Record<string, number> = {};
  for (const o of orders ?? []) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  }

  // Top products by revenue
  const productRevenue: Record<string, { name: string; revenue: number; qty: number }> = {};
  for (const item of orderItems ?? []) {
    const existing = productRevenue[item.product_id] ?? {
      name: item.product_name,
      revenue: 0,
      qty: 0,
    };
    existing.revenue += item.total_price;
    existing.qty += item.quantity;
    productRevenue[item.product_id] = existing;
  }
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">Store performance overview.</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatINR(totalRevenue), sub: "Excl. cancelled & refunded" },
          {
            label: "This Month",
            value: formatINR(thisMonthRevenue),
            sub: revenueChange !== null
              ? `${revenueChange >= 0 ? "+" : ""}${revenueChange}% vs last month`
              : "First month of data",
            subColor: revenueChange !== null
              ? revenueChange >= 0 ? "text-emerald-600" : "text-red-500"
              : "text-zinc-400",
          },
          { label: "Total Orders", value: String(totalOrders), sub: `${validOrders.length} completed` },
          { label: "Avg Order Value", value: formatINR(avgOrderValue), sub: `${(customerCount as { count?: number } | null)?.count ?? 0} customers` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-5">
            <p className="text-xs font-medium text-zinc-500">{s.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-zinc-900 tabular-nums">{s.value}</p>
            <p className={`mt-0.5 text-xs ${(s as { subColor?: string }).subColor ?? "text-zinc-400"}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* Monthly revenue bar chart */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-5">Revenue — Last 6 Months</h2>
          <div className="flex items-end gap-3 h-44">
            {monthlyRevenue.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                <p className="text-xs text-zinc-500 tabular-nums">{m.value > 0 ? formatINR(m.value) : ""}</p>
                <div className="w-full flex items-end" style={{ height: "100px" }}>
                  <div
                    className="w-full bg-indigo-500 rounded-t-md transition-all"
                    style={{ height: `${Math.max(4, (m.value / maxMonthlyRevenue) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-400">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by status */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-700">
                      {ORDER_STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="text-sm font-medium text-zinc-900 tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusColor(status)}`}
                      style={{ width: `${(count / totalOrders) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            {Object.keys(statusCounts).length === 0 && (
              <p className="text-sm text-zinc-400">No orders yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Top Products by Revenue</h2>
        </div>
        {topProducts.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Product</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Units Sold</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {topProducts.map((p, i) => (
                <tr key={i} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-zinc-400 w-4">{i + 1}</span>
                      <span className="font-medium text-zinc-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-zinc-700 tabular-nums">{p.qty}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-zinc-900 tabular-nums">
                    {formatINR(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-10 text-center text-sm text-zinc-400">No sales data yet.</div>
        )}
      </div>
    </div>
  );
}
