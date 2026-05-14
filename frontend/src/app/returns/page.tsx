import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Returns" };

export default function ReturnsPage() {
  return (
    <StaticPage
      eyebrow="Returns"
      title="If something isn't right"
      lead="Flowers are perishable and final sale once dispatched, but if anything arrives damaged or different from what you ordered, we'll make it right."
    >
      <h2>Necklaces</h2>
      <p>30-day return window. Items must be unworn and in original packaging.</p>
      <h2>How to return</h2>
      <p>Email <a href="mailto:hello@xperiencedelivery.test">hello@xperiencedelivery.test</a> with your order number and we'll send a prepaid label.</p>
    </StaticPage>
  );
}