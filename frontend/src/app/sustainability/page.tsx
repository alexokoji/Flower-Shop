import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Sustainability" };

export default function SustainabilityPage() {
  return (
    <StaticPage
      eyebrow="Sustainability"
      title="Slow, by design"
      lead="We work with local growers where we can, recycled metals where they exist, and packaging you can plant or compost."
    >
      <p>Flowers are sourced from regional growers within a 200km radius wherever possible. Stems are composted at the studio.</p>
      <p>Necklaces use recycled gold and silver as the default; stones are conflict-free and traceable.</p>
      <p>Boxes are FSC-certified, ribbons are biodegradable, and we avoid plastic film entirely.</p>
    </StaticPage>
  );
}