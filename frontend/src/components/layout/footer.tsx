import Link from "next/link";
import { Instagram, Facebook, Mail } from "lucide-react";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All flowers", href: "/shop?type=flower" },
      { label: "All necklaces", href: "/shop?type=necklace" },
      { label: "New arrivals", href: "/shop?sort=newest" },
      { label: "Best sellers", href: "/shop?sort=popular" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Journal", href: "/journal" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Care guide", href: "/care" },
      { label: "Consignment", href: "/consignment" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream-100 dark:bg-card mt-20">
      <div className="container-edge py-14 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="display-serif text-2xl">Xperience <span className="text-roseGold">·</span> Delivery</div>
          <p className="text-sm text-muted-foreground max-w-sm">
            Hand-crafted floral arrangements and fine necklaces, made for the moments
            that ask for more than ordinary.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link aria-label="Instagram" href="#" className="p-2 rounded-full border border-border hover:text-roseGold">
              <Instagram className="size-4" />
            </Link>
            <Link aria-label="Facebook" href="#" className="p-2 rounded-full border border-border hover:text-roseGold">
              <Facebook className="size-4" />
            </Link>
            <Link aria-label="Email" href="mailto:hello@xperiencedelivery.test" className="p-2 rounded-full border border-border hover:text-roseGold">
              <Mail className="size-4" />
            </Link>
          </div>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h4 className="eyebrow mb-4">{c.title}</h4>
            <ul className="space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-roseGold">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-edge py-6 text-xs flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-muted-foreground">
          <p>© {new Date().getFullYear()} Xperience Delivery. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-roseGold">Privacy</Link>
            <Link href="/terms" className="hover:text-roseGold">Terms</Link>
            <Link href="/cookies" className="hover:text-roseGold">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
