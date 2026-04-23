import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Admin Dashboard — Alankara",
};

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
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer"),
    supabase.from("orders").select("id, total, status"),
    supabase
      .from("orders")
      .select("id, order_number, created_at, total, status")
      .order("created_at", { ascending: false })
      .limit(6),
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
      (sum, order) =>
        order.status === "cancelled" || order.status === "refunded"
          ? sum
          : sum + order.total,
      0
    ) ?? 0;
  const pendingOrders =
    orders?.filter((order) =>
      ["pending", "confirmed", "processing", "shipped"].includes(order.status)
    ).length ?? 0;

  const cards = [
    {
      label: "Revenue",
      value: formatINR(revenue),
      hint: "Lifetime order value excluding cancelled/refunded",
      href: "/admin/orders",
      icon: TrendingUp,
    },
    {
      label: "Orders",
      value: String(orders?.length ?? 0),
      hint: `${pendingOrders} still in fulfillment`,
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      label: "Products",
      value: String(productCount ?? 0),
      hint: `${lowStockProducts?.length ?? 0} low-stock general products`,
      href: "/admin/products",
      icon: Package,
    },
    {
      label: "Customers",
      value: String(customerCount ?? 0),
      hint: `${categoryCount ?? 0} categories configured`,
      href: "/admin/customers",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
          Overview
        </p>
        <h2 className="mt-1 font-serif text-3xl text-charcoal">
          Business Snapshot
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Track sales, fulfillment, inventory pressure, and jump straight into
          the areas that need attention.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-sm border border-border bg-warm-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {card.label}
                </p>
                <p className="mt-3 font-serif text-3xl text-charcoal">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-muted">{card.hint}</p>
              </div>
              <card.icon className="h-6 w-6 text-terracotta" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <section className="rounded-sm border border-border bg-warm-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="font-medium text-charcoal">Recent Orders</h3>
              <p className="text-sm text-muted">
                Latest order activity across the storefront.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-charcoal hover:text-terracotta"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders && recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-cream/40">
                    <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                      Order
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
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/70">
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-charcoal hover:text-terracotta"
                        >
                          {order.order_number}
                        </Link>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(order.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-muted">No orders yet.</div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <FolderKanban className="h-5 w-5 text-terracotta" />
              <div>
                <h3 className="font-medium text-charcoal">Catalog Health</h3>
                <p className="text-sm text-muted">
                  Keep categories and inventory in good shape.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <Link
                href="/admin/categories"
                className="rounded-sm border border-border px-4 py-3 text-sm text-charcoal transition-colors hover:border-charcoal"
              >
                Manage categories and display order
              </Link>
              <Link
                href="/admin/products"
                className="rounded-sm border border-border px-4 py-3 text-sm text-charcoal transition-colors hover:border-charcoal"
              >
                Review product details, stock, and variant pricing
              </Link>
            </div>
          </section>

          <section className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-charcoal">Low Stock Watch</h3>
                <p className="text-sm text-muted">
                  General products nearing sell-out.
                </p>
              </div>
              <Link
                href="/admin/products"
                className="text-xs font-medium uppercase tracking-[0.12em] text-charcoal hover:text-terracotta"
              >
                Manage
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {lowStockProducts && lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-sm border border-border px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-charcoal">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted">General product</p>
                    </div>
                    <span className="text-sm font-medium text-terracotta">
                      {product.stock_quantity} left
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">
                  No low-stock general products right now.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
