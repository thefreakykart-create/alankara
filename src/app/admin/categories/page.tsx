import type { Metadata } from "next";
import { updateCategoryAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Categories — Alankara Admin",
};

const inputCls =
  "w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const textareaCls =
  "w-full px-3 py-2.5 rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none";
const labelCls = "block text-xs font-medium text-zinc-500 mb-1.5";

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Categories</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage storefront groupings, descriptions, and display order.
        </p>
      </div>

      {/* Create new */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">New Category</h2>
        <form action={updateCategoryAction} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Name *</label>
            <input name="name" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Slug</label>
            <input
              name="slug"
              placeholder="auto-generated if blank"
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea name="description" rows={3} className={textareaCls} />
          </div>
          <div>
            <label className={labelCls}>Image URL</label>
            <input name="imageUrl" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Display Order</label>
            <input
              name="displayOrder"
              type="number"
              defaultValue={categories?.length ?? 0}
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Add Category
            </button>
          </div>
        </form>
      </div>

      {/* Existing categories */}
      <div className="space-y-3">
        {categories?.map((cat) => (
          <form
            key={cat.id}
            action={updateCategoryAction}
            className="bg-white border border-zinc-200 rounded-lg p-5"
          >
            <input type="hidden" name="id" value={cat.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>Name</label>
                <input
                  name="name"
                  defaultValue={cat.name}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Slug</label>
                <input name="slug" defaultValue={cat.slug} className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={cat.description ?? ""}
                  className={textareaCls}
                />
              </div>
              <div>
                <label className={labelCls}>Image URL</label>
                <input
                  name="imageUrl"
                  defaultValue={cat.image_url ?? ""}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Display Order</label>
                <input
                  name="displayOrder"
                  type="number"
                  defaultValue={cat.display_order}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Created {new Date(cat.created_at).toLocaleDateString("en-IN")}
              </p>
              <button
                type="submit"
                className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
