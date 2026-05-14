import { Hero } from "@/components/home/hero";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { FeaturedRail } from "@/components/home/featured-rail";
import { Promotions } from "@/components/home/promotions";
import { Testimonials } from "@/components/home/testimonials";
import { Newsletter } from "@/components/home/newsletter";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryShowcase />
      <FeaturedRail type="flower" title="Featured flowers" eyebrow="Hand-tied today" />
      <FeaturedRail type="necklace" title="Featured necklaces" eyebrow="The atelier" />
      <Promotions />
      <Testimonials />
      <Newsletter />
    </>
  );
}
