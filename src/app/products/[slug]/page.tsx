import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WallArtProduct from "@/components/product/wall-art-product";
import GeneralProduct from "@/components/product/general-product";
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

  // ── General Product ──
  return <GeneralProduct product={product} related={related} />;
}
