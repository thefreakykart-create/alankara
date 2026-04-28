import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import AdminNav from "@/components/admin/admin-nav";
import LogoutButton from "@/components/account/logout-button";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAdmin();

  return (
    <div
      className="fixed inset-0 z-[200] flex bg-zinc-50"
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
    >
      {/* Sidebar */}
      <aside className="w-60 flex-none bg-zinc-900 flex flex-col overflow-y-auto">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center flex-none">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-none">Alankara</p>
              <p className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-wider">Admin</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 py-4">
          <AdminNav />
        </div>

        {/* Quick actions */}
        <div className="px-3 pb-3 space-y-0.5 border-t border-zinc-800 pt-3">
          <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            Quick Actions
          </p>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4 flex-none" />
            Add Product
          </Link>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-t border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-none text-zinc-300 text-xs font-medium uppercase">
            {(profile?.full_name ?? user.email ?? "A")[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate leading-none">
              {profile?.full_name ?? "Admin"}
            </p>
            <p className="text-zinc-500 text-[10px] truncate mt-0.5">{user.email}</p>
          </div>
          <div className="[&>button]:text-zinc-500 [&>button]:hover:text-zinc-200 [&>button_span]:hidden">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-none bg-white border-b border-zinc-200 px-6 h-14 flex items-center justify-end">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Storefront
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
