import { StaticPage } from "@/components/layout/static-page";

export const metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <StaticPage
      eyebrow="Cookies"
      title="Cookie policy"
    >
      <p>We use a small number of cookies and localStorage entries:</p>
      <ul>
        <li><strong>fs-cart</strong> — keeps your shopping bag between visits</li>
        <li><strong>fs-wishlist</strong> — remembers your saved pieces</li>
        <li><strong>pocketbase_auth</strong> — keeps you signed in</li>
        <li><strong>theme</strong> — remembers your light/dark mode preference</li>
      </ul>
      <p>We do not run third-party advertising or tracking cookies.</p>
    </StaticPage>
  );
}