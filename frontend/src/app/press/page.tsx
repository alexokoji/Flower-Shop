import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Press" };

export default function PressPage() {
  return (
    <StaticPage eyebrow="Press" title="In the press">
      <p>For press enquiries and high-res imagery, please contact <a href="mailto:press@xperiencedelivery.test">press@xperiencedelivery.test</a>.</p>
    </StaticPage>
  );
}