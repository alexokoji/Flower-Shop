import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <StaticPage
      eyebrow="Journal"
      title="Letters from the studio"
      lead="Seasonal stories, curator notes, and quiet glimpses of how each piece comes together."
    >
      <p>The journal is being curated. Subscribe to the newsletter on the home page and we'll send the first letter the moment it's ready.</p>
    </StaticPage>
  );
}