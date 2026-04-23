import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Dashboard — Alankara Admin",
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

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  const [
    { count: productCount },
    { count: categoryCount },
    { count: customerCount },
    { data: orders },
    { data: recentOrders },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("orders").select("id, total, status"),
    supabase
      .from("orders")
      .select("id, order_number, created_at, total, status")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select("id, name, stock_quantity")
      .eq("product_type", "general")
      .lte("stock_quantity", 5)
      .order("stock_quantity", { ascending: true })
      .limit(6),
  ]);

  const revenue =
    orders?.reduce(
      (sum, o) =>
        o.status === "cancelled" || o.status === "refunded" ? sum : sum + o.total,
      0
    ) ?? 0;
  const pendingOrders =
    orders?.filter((o) =>
      ["pending", "confirmed", "processing", "shipped"].includes(o.status)
    ).length ?? 0;

  const stats = [
    {
      label: "Lifetime Revenue",
      value: formatINR(revenue),
      sub: "Excl. cancelled & refunded",
      href: "/admin/orders",
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Total Orders",
      value: String(orders?.length ?? 0),
      sub: `${pendingOrders} in fulfillment`,
      href: "/admin/orders",
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Products",
      value: String(productCount ?? 0),
      sub: `${categoryCount ?? 0} categories`,
      href: "/admin/products",
      icon: Package,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Customers",
      value: String(customerCount ?? 0),
      sub: "Registered accounts",
      href: "/admin/customers",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back — here&apos;s what&apos;s happening in your store.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-zinc-200 rounded-lg p-5 flex items-start gap-4 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className={`${s.bg} ${s.color} p-2.5 rounded-lg flex-none`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 tabular-nums">{s.value}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{s.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Recent orders */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentOrders.map((order) => (
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(order.status)}`}>
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-zinc-900 tabular-nums">
                      {formatINR(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              No orders yet.
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Catalog health */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-50 p-2 rounded-lg">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900">Catalog</h2>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/categories"
                className="flex items-center justify-between p-3 rounded-md border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-sm text-zinc-700"
              >
                <span>Manage categories</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center justify-between p-3 rounded-md border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-sm text-zinc-700"
              >
                <span>Review products & stock</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>
            </div>
          </div>

          {/* Low stock */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-900">Low Stock</h2>
              </div>
              <Link
                href="/admin/products"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Manage
              </Link>
            </div>

            {lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0"
                  >
                    <p className="text-sm text-zinc-700 truncate">{p.name}</p>
                    <span className={`text-xs font-semibold tabular-nums ml-4 flex-none ${p.stock_quantity === 0 ? "text-red-600" : "text-amber-600"}`}>
                      {p.stock_quantity} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">All products are well-stocked.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
