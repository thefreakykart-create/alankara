import type { Metadata } from "next";
import { updateProfileRoleAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customers — Alankara Admin",
};

export default async function AdminCustomersPage() {
  const { supabase } = await requireAdmin();

  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("user_id, total, created_at"),
  ]);

  const statsMap = new Map<
    string,
    { totalOrders: number; lifetimeValue: number; lastOrderAt: string | null }
  >();

  for (const o of orders ?? []) {
    const cur = statsMap.get(o.user_id) ?? {
      totalOrders: 0,
      lifetimeValue: 0,
      lastOrderAt: null,
    };
    cur.totalOrders += 1;
    cur.lifetimeValue += o.total;
    cur.lastOrderAt =
      !cur.lastOrderAt || o.created_at > cur.lastOrderAt
        ? o.created_at
        : cur.lastOrderAt;
    statsMap.set(o.user_id, cur);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Customers</h1>
        <p className="mt-1 text-sm text-zinc-500">
          View customer value, order activity, and manage admin access.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Orders</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Lifetime Value</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {profiles?.map((profile) => {
                const stats = statsMap.get(profile.id) ?? {
                  totalOrders: 0,
                  lifetimeValue: 0,
                  lastOrderAt: null,
                };

                return (
                  <tr key={profile.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-900">
                        {profile.full_name || "Unnamed"}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {profile.phone || "No phone"}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Joined {new Date(profile.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-900 tabular-nums">
                        {stats.totalOrders}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {stats.lastOrderAt
                          ? `Last ${new Date(stats.lastOrderAt).toLocaleDateString("en-IN")}`
                          : "No orders"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-zinc-900 tabular-nums">
                      {formatINR(stats.lifetimeValue)}
                    </td>
                    <td className="px-5 py-4">
                      <form
                        action={updateProfileRoleAction}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="profileId" value={profile.id} />
                        <select
                          name="role"
                          defaultValue={profile.role}
                          className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md transition-colors"
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
