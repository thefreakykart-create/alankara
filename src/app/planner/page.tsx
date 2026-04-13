import { createClient } from "@/lib/supabase/server";
import GalleryWallPlanner from "@/components/planner/gallery-wall-planner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery Wall Planner — Alankara",
  description:
    "Design your perfect gallery wall. Mix and match frames, arrange them to your taste, and add all to cart in one click.",
};

export default async function PlannerPage() {
  const supabase = await createClient();

  // Fetch wall_art products with their variants
  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("product_type", "wall_art")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Fetch all variants for these products
  const productIds = products?.map((p) => p.id) ?? [];
  const { data: variants } = productIds.length > 0
    ? await supabase
        .from("product_variants")
        .select("*")
        .in("product_id", productIds)
        .eq("is_active", true)
    : { data: [] };

  // Merge variants into products
  const productsWithVariants = (products ?? []).map((p) => ({
    ...p,
    variants: (variants ?? []).filter((v) => v.product_id === p.id),
  })).filter((p) => p.variants.length > 0);

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-warm-white pt-20">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-terracotta">Design Tool</span>
          <h1 className="font-serif text-xl text-charcoal mt-0.5 tracking-wide">
            Gallery Wall Planner
          </h1>
        </div>
        <p className="text-xs text-muted hidden sm:block max-w-xs text-right leading-relaxed">
          Drag designs onto your wall · configure frame & size · add all to cart
        </p>
      </div>

      {/* Planner (fills remaining height) */}
      <div className="flex-1 overflow-hidden">
        {productsWithVariants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <p className="font-serif text-xl text-charcoal">No Wall Art Yet</p>
            <p className="text-sm text-muted max-w-xs">
              Publish your first wall art designs from the admin panel to start planning.
            </p>
            <a
              href="/admin/products/publish"
              className="mt-2 px-5 py-2.5 bg-charcoal text-warm-white text-xs tracking-wider uppercase rounded-sm hover:bg-terracotta transition-colors"
            >
              Publish Wall Art
            </a>
          </div>
        ) : (
          <GalleryWallPlanner products={productsWithVariants} />
        )}
      </div>
    </div>
  );
}
