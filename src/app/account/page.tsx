import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import LogoutButton from "@/components/account/logout-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account — Alankara",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide">
              My Account
            </h1>
            <p className="text-sm text-muted mt-1">
              Welcome, {profile?.full_name || user.email}
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Profile Info */}
        <section className="mb-12">
          <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-charcoal mb-4">
            Profile
          </h2>
          <div className="bg-warm-white rounded-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted">Name</span>
              <p className="text-charcoal font-medium">
                {profile?.full_name || "—"}
              </p>
            </div>
            <div>
              <span className="text-muted">Email</span>
              <p className="text-charcoal font-medium">{user.email}</p>
            </div>
            <div>
              <span className="text-muted">Phone</span>
              <p className="text-charcoal font-medium">
                {profile?.phone || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Order History */}
        <section>
          <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-charcoal mb-4">
            Orders
          </h2>

          {!orders || orders.length === 0 ? (
            <div className="bg-warm-white rounded-sm p-8 text-center">
              <p className="text-sm text-muted mb-4">
                You haven&apos;t placed any orders yet.
              </p>
              <Link
                href="/products"
                className="text-sm text-terracotta underline underline-offset-4"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-warm-white rounded-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {formatINR(order.total)}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-cream text-charcoal font-medium">
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
