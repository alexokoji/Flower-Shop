"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { featuredProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/product-card";
import { ProductCardSkeleton } from "@/components/shop/product-card-skeleton";

interface Props {
  type: "flower" | "necklace";
  title: string;
  eyebrow?: string;
}

export function FeaturedRail({ type, title, eyebrow }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["catalog", "featured", type],
    queryFn: () => featuredProducts(type, 8),
  });

  return (
    <section className="container-edge py-16 lg:py-24">
      <header className="flex items-end justify-between mb-8">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="display-serif text-4xl lg:text-5xl mt-2">{title}</h2>
        </div>
        <Link href={`/shop?type=${type}`} className="hidden sm:inline-block text-sm hover:text-roseGold">
          See all →
        </Link>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : (data ?? []).slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
