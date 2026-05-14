import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <StaticPage
      eyebrow="Privacy"
      title="Privacy policy"
      lead="We collect only what we need to serve your order, and we never sell your data."
    >
      <h2>What we collect</h2>
      <p>Your contact details, shipping addresses, order history, and the data your browser sends when you visit us (IP, device, page paths). Payment data goes directly to the payment provider — we never see card details.</p>
      <h2>How we use it</h2>
      <p>To process orders, send transactional emails, and improve the storefront. With your consent, we send seasonal newsletters.</p>
      <h2>Your choices</h2>
      <p>You can delete your account or download your data at any time by contacting us.</p>
    </StaticPage>
  );
}