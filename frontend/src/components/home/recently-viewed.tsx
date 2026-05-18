"use client";

import { useQuery } from "@tanstack/react-query";
import { pb } from "@/lib/pb";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/types";

export function RecentlyViewed() {
  const { ids } = useRecentlyViewed();

  const { data } = useQuery({
    queryKey: ["recently-viewed", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      if (ids.length === 0) return [] as Product[];
      const filter = ids.map((id) => `id = "${id}"`).join(" || ");
      const items = await pb().collection("products").getFullList<Product>({
        filter,
        expand: "category",
      });
      // Preserve recently-viewed order (PB returns by created-desc otherwise)
      const idx = new Map(ids.map((id, i) => [id, i]));
      return items.sort((a, b) => (idx.get(a.id) ?? 99) - (idx.get(b.id) ?? 99));
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="container-edge py-16 lg:py-24">
      <header className="mb-8">
        <p className="eyebrow">Just for you</p>
        <h2 className="display-serif text-3xl lg:text-4xl mt-2">Recently viewed</h2>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {data.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}