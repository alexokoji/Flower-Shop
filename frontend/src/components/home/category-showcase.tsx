import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { label: "Wedding",     href: "/shop?type=flower&category=wedding-flowers",       src: "/products/wedding-1.jpg" },
  { label: "Birthday",    href: "/shop?type=flower&category=birthday-flowers",      src: "/products/bouquet-2.jpg" },
  { label: "Valentine",   href: "/shop?type=flower&category=valentine-flowers",     src: "/products/rose-red-3.jpg" },
  { label: "Pendants",    href: "/shop?type=necklace&category=pendants-necklaces",  src: "/products/pendant-1.jpg" },
  { label: "Chains",      href: "/shop?type=necklace&category=chains-necklaces",    src: "/products/gold-chain-3.jpg" },
  { label: "Stone & Gem", href: "/shop?type=necklace&category=stone-gem-necklaces", src: "/products/emerald-1.jpg" },
];

export function CategoryShowcase() {
  return (
    <section className="container-edge py-16 lg:py-24">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow">Curated</p>
          <h2 className="display-serif text-4xl lg:text-5xl mt-2">Categories</h2>
        </div>
        <Link href="/shop" className="hidden sm:inline-block text-sm hover:text-roseGold">View all →</Link>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {CATEGORIES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative aspect-[5/6] rounded-2xl overflow-hidden bg-cream-100 shadow-soft"
          >
            <Image
              src={c.src}
              alt={c.label}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/20 to-transparent" />
            <div className="absolute inset-0 flex items-end p-5">
              <div>
                <div className="eyebrow text-cream-50/80">Shop</div>
                <h3 className="display-serif text-2xl lg:text-3xl text-cream-50 transition-colors group-hover:text-roseGold-200">
                  {c.label}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}