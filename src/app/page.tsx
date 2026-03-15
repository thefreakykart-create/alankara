import Hero from "@/components/home/hero";
import FeaturedScroll from "@/components/home/featured-scroll";
import CategoryCards from "@/components/home/category-cards";
import MarqueeBanner from "@/components/home/marquee-banner";
import BrandStory from "@/components/home/brand-story";
import Testimonials from "@/components/home/testimonials";
import Newsletter from "@/components/home/newsletter";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedScroll />
      <MarqueeBanner />
      <CategoryCards />
      <BrandStory />
      <Testimonials />
      <Newsletter />
    </>
  );
}
