import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/product/product-card";
import ProductFilters from "@/components/product/product-filters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All — Alankara",
  description:
    "Explore our curated collection of handcrafted Indian home decor. From brass urlis to block-print textiles, find pieces that tell a story.",
};

interface PageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order");

  // Build product query
  let query = supabase
    .from("products")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("is_active", true);

  // Filter by category
  if (params.category) {
    const cat = categories?.find((c) => c.slug === params.category);
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  // Sort
  switch (params.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "name-asc":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: products, count } = await query;

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl lg:text-4xl text-charcoal tracking-wide">
            Our Collection
          </h1>
          <p className="mt-2 text-muted text-sm max-w-xl">
            Each piece is handcrafted by Indian artisans, blending heritage
            techniques with contemporary design.
          </p>
        </div>

        {/* Filters */}
        <Suspense fallback={null}>
          <ProductFilters
            categories={categories || []}
            totalCount={count || 0}
          />
        </Suspense>

        {/* Product Grid */}
        {products && products.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-6 lg:gap-y-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-20 text-center">
            <p className="text-muted text-lg">No products found.</p>
            <p className="text-sm text-muted mt-2">
              Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
