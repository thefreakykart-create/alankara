import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Orders — Alankara Admin",
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide mb-8">
          Orders
        </h1>

        {!orders || orders.length === 0 ? (
          <div className="bg-warm-white rounded-sm p-8 text-center">
            <p className="text-sm text-muted">No orders yet.</p>
          </div>
        ) : (
          <div className="bg-warm-white rounded-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs text-muted tracking-wider uppercase font-medium">
                    Order
                  </th>
                  <th className="text-left p-4 text-xs text-muted tracking-wider uppercase font-medium">
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
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border/50 hover:bg-cream/50 transition-colors"
                  >
                    <td className="p-4 font-medium">{order.order_number}</td>
                    <td className="p-4 text-muted">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-cream font-medium">
                        {ORDER_STATUS_LABELS[order.status] || order.status}
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
        )}
      </div>
    </main>
  );
}
