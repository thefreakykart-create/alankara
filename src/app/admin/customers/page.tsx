import type { Metadata } from "next";
import { updateProfileRoleAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Manage Customers — Alankara Admin",
};

export default async function AdminCustomersPage() {
  const { supabase } = await requireAdmin();

  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("user_id, total, created_at"),
  ]);

  const customerStats = new Map<
    string,
    { totalOrders: number; lifetimeValue: number; lastOrderAt: string | null }
  >();

  for (const order of orders ?? []) {
    const current = customerStats.get(order.user_id) ?? {
      totalOrders: 0,
      lifetimeValue: 0,
      lastOrderAt: null,
    };
    current.totalOrders += 1;
    current.lifetimeValue += order.total;
    current.lastOrderAt =
      !current.lastOrderAt || order.created_at > current.lastOrderAt
        ? order.created_at
        : current.lastOrderAt;
    customerStats.set(order.user_id, current);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
          Relationships
        </p>
        <h2 className="mt-1 font-serif text-3xl text-charcoal">Customers</h2>
        <p className="mt-2 text-sm text-muted">
          See customer value, order activity, and manage who has admin access.
        </p>
      </div>

      <div className="overflow-hidden rounded-sm border border-border bg-warm-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/40">
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                  Customer
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                  Orders
                </th>
                <th className="px-5 py-3 text-right text-xs uppercase tracking-[0.16em] text-muted">
                  Lifetime Value
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map((profile) => {
                const stats = customerStats.get(profile.id) ?? {
                  totalOrders: 0,
                  lifetimeValue: 0,
                  lastOrderAt: null,
                };

                return (
                  <tr key={profile.id} className="border-b border-border/70">
                    <td className="px-5 py-4">
                      <p className="font-medium text-charcoal">
                        {profile.full_name || "Unnamed customer"}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {profile.phone || "No phone on profile"}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Joined{" "}
                        {new Date(profile.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-charcoal">
                        {stats.totalOrders}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {stats.lastOrderAt
                          ? `Last order ${new Date(stats.lastOrderAt).toLocaleDateString(
                              "en-IN"
                            )}`
                          : "No orders yet"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-charcoal">
                      {formatINR(stats.lifetimeValue)}
                    </td>
                    <td className="px-5 py-4">
                      <form action={updateProfileRoleAction} className="flex items-center gap-3">
                        <input type="hidden" name="profileId" value={profile.id} />
                        <select
                          name="role"
                          defaultValue={profile.role}
                          className="h-10 rounded-sm border border-border bg-transparent px-3 text-sm focus:border-charcoal focus:outline-none"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-sm border border-charcoal px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-charcoal transition-colors hover:bg-charcoal hover:text-warm-white"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
