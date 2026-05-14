import Image from "next/image";
import Link from "next/link";

export function Promotions() {
  return (
    <section className="container-edge py-16 lg:py-24">
      <div className="grid lg:grid-cols-2 gap-6">
        <Link
          href="/shop?type=flower&sort=newest"
          className="group relative h-[320px] lg:h-[420px] rounded-3xl overflow-hidden shadow-luxe"
        >
          <Image
            src="/products/peony-3.jpg"
            alt="Spring blooms"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-ink-900/70 via-ink-900/20 to-transparent" />
          <div className="absolute inset-0 p-8 flex flex-col justify-end text-cream-50">
            <p className="eyebrow text-cream-50/80">Spring edit</p>
            <h3 className="display-serif text-4xl lg:text-5xl max-w-xs mt-2">
              New season blooms, freshly cut.
            </h3>
            <span className="mt-4 inline-block text-sm underline underline-offset-4 group-hover:text-roseGold-200 transition-colors">
              Shop the edit →
            </span>
          </div>
        </Link>
        <Link
          href="/shop?type=necklace"
          className="group relative h-[320px] lg:h-[420px] rounded-3xl overflow-hidden shadow-luxe"
        >
          <Image
            src="/products/diamond-1.jpg"
            alt="Fine necklaces"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-ink-900/85 via-ink-900/40 to-roseGold-600/30" />
          <div className="absolute inset-0 p-8 flex flex-col justify-end text-cream-50">
            <p className="eyebrow text-cream-50/80">Atelier</p>
            <h3 className="display-serif text-4xl lg:text-5xl max-w-xs mt-2">
              Heirlooms, hand-finished.
            </h3>
            <span className="mt-4 inline-block text-sm underline underline-offset-4 group-hover:text-roseGold-200 transition-colors">
              Explore necklaces →
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}