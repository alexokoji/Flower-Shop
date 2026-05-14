import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <StaticPage
      eyebrow="Get in touch"
      title="We'd love to hear from you"
      lead="Questions about an order, a bespoke arrangement, or a private commission — we usually reply within a business day."
    >
      <ul className="not-prose space-y-3">
        <li className="surface-luxe p-5">
          <p className="font-medium">Customer care</p>
          <p className="text-sm text-muted-foreground">
            <a href="mailto:hello@xperiencedelivery.test" className="hover:text-roseGold">hello@xperiencedelivery.test</a>
          </p>
        </li>
        <li className="surface-luxe p-5">
          <p className="font-medium">Wholesale &amp; events</p>
          <p className="text-sm text-muted-foreground">
            <a href="mailto:events@xperiencedelivery.test" className="hover:text-roseGold">events@xperiencedelivery.test</a>
          </p>
        </li>
      </ul>
    </StaticPage>
  );
}