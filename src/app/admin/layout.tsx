import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
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
    <main className="min-h-screen bg-cream pt-24 pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-sm border border-border bg-warm-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-terracotta">
              Admin Console
            </p>
            <h1 className="mt-1 font-serif text-2xl text-charcoal">
              Store Management
            </h1>
            <p className="mt-1 text-sm text-muted">
              Signed in as {profile?.full_name || user.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-sm border border-charcoal px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-charcoal transition-colors hover:bg-charcoal hover:text-warm-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </Link>
            <Link
              href="/admin/products/publish"
              className="inline-flex items-center gap-2 rounded-sm bg-charcoal px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-warm-white transition-colors hover:bg-terracotta"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Publish Wall Art
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-sm border border-border bg-warm-white p-4 shadow-sm h-fit">
            <AdminNav />
          </aside>
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </main>
  );
}
