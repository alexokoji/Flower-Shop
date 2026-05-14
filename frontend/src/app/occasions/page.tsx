import Link from "next/link";
import { StaticPage } from "@/components/layout/static-page";

const OCCASIONS = [
  { label: "Wedding", href: "/shop?type=flower&category=wedding-flowers" },
  { label: "Birthday", href: "/shop?type=flower&category=birthday-flowers" },
  { label: "Valentine", href: "/shop?type=flower&category=valentine-flowers" },
  { label: "Anniversary", href: "/shop?type=flower&category=anniversary-flowers" },
  { label: "Funeral", href: "/shop?type=flower&category=funeral-flowers" },
  { label: "Graduation", href: "/shop?type=flower&category=graduation-flowers" },
];

export const metadata = { title: "Occasions" };

export default function OccasionsPage() {
  return (
    <StaticPage
      eyebrow="By occasion"
      title="Flowers for the moments that ask for more"
    >
      <ul className="not-prose grid sm:grid-cols-2 gap-3">
        {OCCASIONS.map((o) => (
          <li key={o.href}>
            <Link
              href={o.href}
              className="block surface-luxe p-5 hover:shadow-luxe transition-shadow"
            >
              <p className="display-serif text-xl">{o.label}</p>
              <p className="text-sm text-muted-foreground mt-1">Shop the edit →</p>
            </Link>
          </li>
        ))}
      </ul>
    </StaticPage>
  );
}