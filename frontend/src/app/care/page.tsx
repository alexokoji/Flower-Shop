import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Care guide" };

export default function CarePage() {
  return (
    <StaticPage
      eyebrow="Care"
      title="Looking after your pieces"
    >
      <h2>Flowers</h2>
      <ul>
        <li>Trim stems on a diagonal every two days.</li>
        <li>Change water every two days; use the included sachet if provided.</li>
        <li>Keep arrangements away from direct sunlight, drafts, and ripening fruit.</li>
      </ul>
      <h2>Necklaces</h2>
      <ul>
        <li>Last on, first off — perfume, lotion, and water dull the finish.</li>
        <li>Store flat in the included pouch; avoid contact with other jewelry.</li>
        <li>Wipe gently with a soft cloth after wearing. Bring stones-set pieces to a jeweler annually.</li>
      </ul>
    </StaticPage>
  );
}