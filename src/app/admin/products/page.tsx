import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Products — Alankara Admin",
};

export default async function AdminProductsPage() {
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

  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide">
            Products
          </h1>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-charcoal text-warm-white text-sm font-medium tracking-wider uppercase px-5 py-2.5 rounded-sm hover:bg-terracotta transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>

        <div className="bg-warm-white rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs text-muted tracking-wider uppercase font-medium">
                  Product
                </th>
                <th className="text-left p-4 text-xs text-muted tracking-wider uppercase font-medium hidden md:table-cell">
                  Category
                </th>
                <th className="text-right p-4 text-xs text-muted tracking-wider uppercase font-medium">
                  Price
                </th>
                <th className="text-right p-4 text-xs text-muted tracking-wider uppercase font-medium hidden sm:table-cell">
                  Stock
                </th>
                <th className="text-center p-4 text-xs text-muted tracking-wider uppercase font-medium hidden sm:table-cell">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-12 flex-shrink-0 bg-cream rounded-sm overflow-hidden">
                        <Image
                          src={p.images?.[0] || "/placeholder.jpg"}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-charcoal truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted hidden md:table-cell">
                    {p.category?.name || "—"}
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatINR(p.price)}
                  </td>
                  <td className="p-4 text-right hidden sm:table-cell">
                    <span
                      className={
                        p.stock_quantity <= 5
                          ? "text-terracotta font-medium"
                          : "text-muted"
                      }
                    >
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="p-4 text-center hidden sm:table-cell">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-emerald/10 text-emerald" : "bg-red-50 text-red-500"}`}
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
