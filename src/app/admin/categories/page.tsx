import type { Metadata } from "next";
import { updateCategoryAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Manage Categories — Alankara Admin",
};

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
          Catalog Structure
        </p>
        <h2 className="mt-1 font-serif text-3xl text-charcoal">Categories</h2>
        <p className="mt-2 text-sm text-muted">
          Manage storefront groupings, collection descriptions, and homepage
          imagery.
        </p>
      </div>

      <section className="rounded-sm border border-border bg-warm-white p-5 shadow-sm">
        <h3 className="font-medium text-charcoal">Create Category</h3>
        <form action={updateCategoryAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">
              Name
            </span>
            <input
              name="name"
              required
              className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">
              Slug
            </span>
            <input
              name="slug"
              placeholder="auto-generated if blank"
              className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">
              Description
            </span>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-sm border border-border px-3 py-3 text-sm focus:border-charcoal focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">
              Image URL
            </span>
            <input
              name="imageUrl"
              className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">
              Display Order
            </span>
            <input
              name="displayOrder"
              type="number"
              defaultValue={categories?.length ?? 0}
              className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-sm bg-charcoal px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-warm-white transition-colors hover:bg-terracotta"
            >
              Add Category
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        {categories?.map((category) => (
          <form
            key={category.id}
            action={updateCategoryAction}
            className="rounded-sm border border-border bg-warm-white p-5 shadow-sm"
          >
            <input type="hidden" name="id" value={category.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Name
                </span>
                <input
                  name="name"
                  defaultValue={category.name}
                  required
                  className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Slug
                </span>
                <input
                  name="slug"
                  defaultValue={category.slug}
                  className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Description
                </span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={category.description ?? ""}
                  className="w-full rounded-sm border border-border px-3 py-3 text-sm focus:border-charcoal focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Image URL
                </span>
                <input
                  name="imageUrl"
                  defaultValue={category.image_url ?? ""}
                  className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Display Order
                </span>
                <input
                  name="displayOrder"
                  type="number"
                  defaultValue={category.display_order}
                  className="h-11 w-full rounded-sm border border-border px-3 text-sm focus:border-charcoal focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted">
                Created {new Date(category.created_at).toLocaleDateString("en-IN")}
              </p>
              <button
                type="submit"
                className="rounded-sm border border-charcoal px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-charcoal transition-colors hover:bg-charcoal hover:text-warm-white"
              >
                Save
              </button>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
