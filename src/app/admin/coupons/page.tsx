"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCouponAction, toggleCouponAction, deleteCouponAction } from "@/app/admin/actions";
import { formatINR } from "@/lib/utils";
import { Tag, ToggleLeft, ToggleRight, Trash2, Plus } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const inputCls =
  "w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchCoupons = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCoupons(data as Coupon[]);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      await createCouponAction(formData);
      (e.target as HTMLFormElement).reset();
      setShowForm(false);
      await fetchCoupons();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create coupon");
    }
  };

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleCouponAction(id, !current);
      await fetchCoupons();
    });
  };

  const handleDelete = async (formData: FormData) => {
    if (!confirm("Delete this coupon?")) return;
    startTransition(async () => {
      await deleteCouponAction(formData);
      await fetchCoupons();
    });
  };

  const displayValue = (c: Coupon) =>
    c.type === "percentage" ? `${c.value}% off` : `${formatINR(c.value)} off`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Coupons</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create and manage discount codes for your store.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Coupon
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">New Coupon</h2>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Code *</label>
              <input
                name="code"
                required
                placeholder="SUMMER20"
                className={`${inputCls} uppercase`}
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select name="type" required className={inputCls}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Value *</label>
              <input
                name="value"
                type="number"
                step="1"
                min="1"
                required
                placeholder="e.g. 20 for 20% or 200 for ₹200"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-zinc-400">
                For percentage: enter 1–100. For fixed: enter amount in ₹.
              </p>
            </div>
            <div>
              <label className={labelCls}>Min Order Amount (₹)</label>
              <input name="minOrderAmount" type="number" step="0.01" defaultValue="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Uses (blank = unlimited)</label>
              <input name="maxUses" type="number" placeholder="Unlimited" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expires At</label>
              <input name="expiresAt" type="datetime-local" className={inputCls} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Create Coupon
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="px-5 py-2.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-400">Loading…</div>
        ) : coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Code</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Discount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Min Order</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Usage</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Expires</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-zinc-500">Active</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-zinc-500">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-indigo-500 flex-none" />
                        <span className="font-mono font-semibold text-zinc-900 text-sm">{c.code}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-900">{displayValue(c)}</td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {c.min_order_amount > 0 ? formatINR(c.min_order_amount) : "None"}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {c.used_count} / {c.max_uses ?? "∞"}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {c.expires_at
                        ? new Date(c.expires_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                        : "Never"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        disabled={pending}
                        onClick={() => handleToggle(c.id, c.is_active)}
                        className="disabled:opacity-40"
                      >
                        {c.is_active
                          ? <ToggleRight className="w-6 h-6 text-emerald-600" />
                          : <ToggleLeft className="w-6 h-6 text-zinc-300" />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <form action={handleDelete}>
                        <input type="hidden" name="couponId" value={c.id} />
                        <button type="submit" className="text-zinc-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Tag className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No coupons yet. Create your first discount code.</p>
          </div>
        )}
      </div>
    </div>
  );
}
