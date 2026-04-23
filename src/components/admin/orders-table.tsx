"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  total: number;
  shipping_address: Record<string, string> | null;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
}

interface Props {
  orders: Order[];
  profileMap: Record<string, Profile>;
}

const PAGE_SIZE = 20;

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

export default function OrdersTable({ orders, profileMap }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      if (q && !o.order_number.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ["Order Number", "Date", "Customer", "Status", "Total (₹)"];
    const rows = filtered.map((o) => {
      const addr = o.shipping_address as { fullName?: string; city?: string } | null;
      const name = profileMap[o.user_id]?.full_name || addr?.fullName || "Customer";
      return [
        o.order_number,
        new Date(o.created_at).toLocaleDateString("en-IN"),
        name,
        ORDER_STATUS_LABELS[o.status] ?? o.status,
        (o.total / 100).toFixed(2),
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alankara-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search order number…"
            className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <span className="text-xs text-zinc-400">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
        <button
          onClick={exportCSV}
          className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Order</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginated.map((order) => {
                const addr = order.shipping_address as { fullName?: string; city?: string; state?: string } | null;
                const name = profileMap[order.user_id]?.full_name || addr?.fullName || "Customer";
                return (
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
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-zinc-900">{name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {[addr?.city, addr?.state].filter(Boolean).join(", ") || "—"}
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
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-zinc-400">
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">Page {safePage} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .reduce<(number | "…")[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((item, i) =>
                item === "…" ? (
                  <span key={`e-${i}`} className="px-1 text-zinc-400 text-sm">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`h-8 w-8 text-sm rounded-md border transition-colors ${
                      item === safePage
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
