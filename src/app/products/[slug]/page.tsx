import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR, getDiscountPercent } from "@/lib/utils";
import ProductGallery from "@/components/product/product-gallery";
import AddToCartButton from "@/components/product/add-to-cart-button";
import ProductDetailsAccordion from "@/components/product/product-details-accordion";
import ProductCard from "@/components/product/product-card";
import WallArtProduct from "@/components/product/wall-art-product";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!product) return { title: "Product Not Found — Alankara" };

  return {
    title: `${product.name} — Alankara`,
    description:
      product.description?.slice(0, 160) || `Shop ${product.name} at Alankara`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  // Fetch variants for wall_art products
  const { data: variants } = product.product_type === "wall_art"
    ? await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true)
        .order("size")
    : { data: [] };

  // Fetch sibling products in the same group (for frame type switching)
  const { data: groupProducts } = product.group_id
    ? await supabase
        .from("products")
        .select("id, name, slug, frame_type")
        .eq("group_id", product.group_id)
        .eq("is_active", true)
        .order("frame_type")
    : { data: [] };

  // Related products from same category, excluding same group members
  const relatedQuery = supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(product.group_id ? 8 : 4);

  const { data: relatedRaw } = await relatedQuery;
  const related = product.group_id
    ? (relatedRaw ?? []).filter((p) => p.group_id !== product.group_id).slice(0, 4)
    : (relatedRaw ?? []).slice(0, 4);

  // ── Wall Art Product (variant-based) ──
  if (product.product_type === "wall_art" && variants && variants.length > 0) {
    return (
      <WallArtProduct
        product={product}
        variants={variants}
        related={related}
        groupProducts={groupProducts ?? []}
      />
    );
  }

  // ── General Product (existing layout) ──
  const discount = product.compare_at_price
    ? getDiscountPercent(product.price, product.compare_at_price)
    : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "INR",
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="min-h-screen pt-28 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-muted tracking-wide">
          <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-charcoal transition-colors">Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-charcoal transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-charcoal">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <ProductGallery images={product.images || []} />

          <div className="lg:sticky lg:top-32 lg:self-start space-y-6">
            {product.category && (
              <p className="text-xs text-muted tracking-[0.15em] uppercase">
                {product.category.name}
              </p>
            )}
            <h1 className="font-serif text-2xl lg:text-3xl text-charcoal tracking-wide">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-medium text-charcoal">
                {formatINR(product.price)}
              </span>
              {product.compare_at_price && (
                <>
                  <span className="text-base text-muted line-through">
                    {formatINR(product.compare_at_price)}
                  </span>
                  <span className="text-xs font-medium text-burgundy tracking-wider uppercase">
                    {discount}% off
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted">Inclusive of all taxes</p>
            {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
              <p className="text-xs text-terracotta font-medium">
                Only {product.stock_quantity} left in stock
              </p>
            )}
            <AddToCartButton product={product} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="border border-border rounded-sm p-3 text-center">
                <p className="text-xs text-muted">Free Shipping</p>
                <p className="text-xs text-charcoal font-medium">Above ₹999</p>
              </div>
              <div className="border border-border rounded-sm p-3 text-center">
                <p className="text-xs text-muted">Easy Returns</p>
                <p className="text-xs text-charcoal font-medium">7 Days</p>
              </div>
            </div>
            <ProductDetailsAccordion product={product} />
          </div>
        </div>

        {related && related.length > 0 && (
          <section className="mt-20 lg:mt-28">
            <h2 className="font-serif text-2xl text-charcoal tracking-wide mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 lg:gap-x-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
