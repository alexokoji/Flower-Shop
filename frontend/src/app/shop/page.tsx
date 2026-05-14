"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listProducts, type ProductQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/shop/product-card";
import { ProductCardSkeleton } from "@/components/shop/product-card-skeleton";
import { ProductListRow } from "@/components/shop/product-list-row";
import { ShopFilters } from "@/components/shop/shop-filters";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { Pagination } from "@/components/shop/pagination";

function ShopInner() {
  const params = useSearchParams();
  const [view, setView] = useState<"grid" | "list">("grid");

  const type = (params.get("type") as "flower" | "necklace" | null) ?? undefined;

  const qry: ProductQuery = {
    type,
    category: params.get("category") ?? undefined,
    q: params.get("q") ?? undefined,
    min_price: params.get("min_price") ? Number(params.get("min_price")) : undefined,
    max_price: params.get("max_price") ? Number(params.get("max_price")) : undefined,
    color: params.get("color") ?? undefined,
    occasion: params.get("occasion") ?? undefined,
    in_stock: params.get("in_stock") === "true",
    sort: (params.get("sort") as ProductQuery["sort"]) ?? "popular",
    page: params.get("page") ? Number(params.get("page")) : 1,
    per_page: 12,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["catalog", "list", qry],
    queryFn: () => listProducts(qry),
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("shop-view") as "grid" | "list" | null;
      if (stored) setView(stored);
    }
  }, []);

  function changeView(v: "grid" | "list") {
    setView(v);
    window.localStorage.setItem("shop-view", v);
  }

  const title =
    type === "flower" ? "Flowers" :
    type === "necklace" ? "Necklaces" :
    "Shop";

  const total = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const page = data?.page ?? qry.page ?? 1;

  return (
    <div className="container-edge py-10 lg:py-14">
      <header className="mb-8 lg:mb-12">
        <p className="eyebrow">All in bloom</p>
        <h1 className="display-serif text-4xl lg:text-5xl mt-2">{title}</h1>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <ShopFilters type={type} />
        <div className="min-w-0 space-y-6">
          <ShopToolbar
            totalLabel={isLoading ? "Loading…" : `${total} ${total === 1 ? "result" : "results"}`}
            view={view}
            onViewChange={changeView}
          />

          {isLoading ? (
            <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6" : "space-y-4"}>
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : total === 0 ? (
            <div className="surface-luxe p-12 text-center">
              <p className="display-serif text-2xl">Nothing matches that yet</p>
              <p className="text-sm text-muted-foreground mt-2">Try widening your filters or clearing the search.</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {data?.items.map((p) => <ProductListRow key={p.id} product={p} />)}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-edge py-14 text-sm text-muted-foreground">Loading…</div>}>
      <ShopInner />
    </Suspense>
  );
}