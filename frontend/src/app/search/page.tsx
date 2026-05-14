"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/product-card";
import { ProductCardSkeleton } from "@/components/shop/product-card-skeleton";

function SearchInner() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["catalog", "search", q],
    queryFn: () => listProducts({ q, per_page: 24 }),
    enabled: !!q,
  });

  return (
    <div className="container-edge py-10 lg:py-14">
      <header className="mb-8">
        <p className="eyebrow">Search</p>
        <h1 className="display-serif text-4xl lg:text-5xl mt-2">
          {q ? `Results for "${q}"` : "Search"}
        </h1>
        <form className="mt-4 max-w-xl">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search flowers, necklaces, occasions…"
            className="w-full h-12 px-5 rounded-full border border-border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
      </header>

      {q && (
        isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : data?.totalItems === 0 ? (
          <div className="surface-luxe p-12 text-center">
            <p className="display-serif text-2xl">No matches found</p>
            <p className="text-sm text-muted-foreground mt-2">Try a shorter or simpler query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-edge py-14 text-sm text-muted-foreground">Loading…</div>}>
      <SearchInner />
    </Suspense>
  );
}