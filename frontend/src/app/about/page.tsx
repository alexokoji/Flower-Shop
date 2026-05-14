import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Our story" };

export default function AboutPage() {
  return (
    <StaticPage
      eyebrow="Our story"
      title="A workshop, two ateliers, one feeling."
      lead="Xperience Delivery began as a small studio between a flower market and a goldsmith's bench. We make pieces that ask to be remembered."
    >
      <p>
        Every bouquet is hand-tied the morning it ships. Every necklace is finished by one of three artisans
        we've worked with for years. We don't drop-ship and we don't outsource the parts that matter.
      </p>
      <p>
        If we don't think a piece would be a gift you'd be proud to give, it doesn't leave the studio.
      </p>
    </StaticPage>
  );
}