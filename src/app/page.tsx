import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/home/hero";
import FeaturedScroll from "@/components/home/featured-scroll";
import CategoryCards from "@/components/home/category-cards";
import MarqueeBanner from "@/components/home/marquee-banner";
import BrandStory from "@/components/home/brand-story";
import Testimonials from "@/components/home/testimonials";
import Newsletter from "@/components/home/newsletter";

export const revalidate = 3600; // ISR: revalidate every hour to save egress

export default async function Home() {
  const supabase = await createClient();

  const [{ data: featured }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, price, images")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("categories")
      .select("name, slug, image_url, description")
      .order("display_order")
      .limit(4),
  ]);

  return (
    <>
      <Hero />
      <FeaturedScroll products={featured || []} />
      <MarqueeBanner />
      <CategoryCards categories={categories || []} />
      <BrandStory />
      <Testimonials />
      <Newsletter />
    </>
  );
}
