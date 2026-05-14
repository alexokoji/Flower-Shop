import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <StaticPage
      eyebrow="Terms"
      title="Terms of service"
      lead="By using Xperience Delivery you agree to these terms."
    >
      <h2>Orders</h2>
      <p>An order is a binding contract once payment is confirmed. We may decline or refund any order at our discretion.</p>
      <h2>Pricing</h2>
      <p>Prices and availability are subject to change without notice. Local taxes and import duties (where applicable) are your responsibility.</p>
      <h2>Intellectual property</h2>
      <p>All imagery, copy, and designs are the property of Xperience Delivery and may not be reproduced without permission.</p>
    </StaticPage>
  );
}