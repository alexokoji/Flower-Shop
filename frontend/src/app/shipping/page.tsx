import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Shipping" };

export default function ShippingPage() {
  return (
    <StaticPage
      eyebrow="Shipping"
      title="How your order travels"
      lead="Insured delivery on every order. Flowers ship same-day to local zones; jewelry ships globally with full tracking."
    >
      <h2>Standard</h2>
      <p>Local: same-day to 3 days. International: 5–7 business days.</p>
      <h2>Express</h2>
      <p>1–3 business days where available, with priority handling.</p>
      <h2>Tracking</h2>
      <p>You'll receive a tracking link the moment your order is dispatched. The same link is always available in <a href="/account/orders">your account</a>.</p>
    </StaticPage>
  );
}