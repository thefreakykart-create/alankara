import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — Alankara",
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  // Fetch stats
  const [
    { count: productCount },
    { count: orderCount },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalRevenue =
    recentOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

  const stats = [
    {
      label: "Products",
      value: productCount || 0,
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Orders",
      value: orderCount || 0,
      icon: ShoppingCart,
      href: "/admin/orders",
    },
    {
      label: "Revenue",
      value: formatINR(totalRevenue),
      icon: TrendingUp,
      href: "/admin/orders",
    },
  ];

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide mb-8">
          Admin Dashboard
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-warm-white rounded-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted tracking-wider uppercase">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-serif text-charcoal mt-1">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className="w-8 h-8 text-border" />
              </div>
            </Link>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            href="/admin/products/new"
            className="bg-charcoal text-warm-white rounded-sm p-6 hover:bg-terracotta transition-colors text-center"
          >
            <Package className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium tracking-wider uppercase">
              Add New Product
            </p>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-charcoal text-warm-white rounded-sm p-6 hover:bg-terracotta transition-colors text-center"
          >
            <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium tracking-wider uppercase">
              Manage Orders
            </p>
          </Link>
        </div>

        {/* Recent Orders */}
        {recentOrders && recentOrders.length > 0 && (
          <section>
            <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-charcoal mb-4">
              Recent Orders
            </h2>
            <div className="bg-warm-white rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs text-muted tracking-wider uppercase font-medium">
                      Order
                    </th>
                    <th className="text-left p-4 text-xs text-muted tracking-wider uppercase font-medium hidden sm:table-cell">
                      Date
                    </th>
                    <th className="text-left p-4 text-xs text-muted tracking-wider uppercase font-medium">
                      Status
                    </th>
                    <th className="text-right p-4 text-xs text-muted tracking-wider uppercase font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50">
                      <td className="p-4 font-medium">
                        {order.order_number}
                      </td>
                      <td className="p-4 text-muted hidden sm:table-cell">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-4">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-cream font-medium">
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatINR(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
