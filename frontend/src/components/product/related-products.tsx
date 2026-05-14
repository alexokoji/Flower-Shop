"use client";

import { useQuery } from "@tanstack/react-query";
import { relatedProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/types";

export function RelatedProducts({ product }: { product: Product }) {
  const { data } = useQuery({
    queryKey: ["catalog", "related", product.id],
    queryFn: () => relatedProducts(product, 8),
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="py-16 lg:py-24">
      <header className="mb-8">
        <p className="eyebrow">More like this</p>
        <h2 className="display-serif text-3xl lg:text-4xl mt-2">You may also like</h2>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {data.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}