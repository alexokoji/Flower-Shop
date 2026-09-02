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
import { PageHeader, EmptyState, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import Link from "next/link";

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

  const subtitle =
    type === "flower"
      ? "Cut to order and hand-tied the morning they travel."
      : type === "necklace"
        ? "Solid gold, freshwater pearl and certified stones."
        : "The full collection — flowers and fine jewelry, in one place.";

  return (
    <div className="container-page py-8 lg:py-12">
      <PageHeader
        eyebrow="Members' collection"
        title={title}
        description={subtitle}
        className="mb-8"
        actions={
          <Badge variant="outline" size="md">
            {isLoading ? "Loading…" : `${total} ${total === 1 ? "piece" : "pieces"}`}
          </Badge>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[248px_1fr]">
        <ShopFilters type={type} />
        <div className="min-w-0 space-y-6">
          <ShopToolbar
            totalLabel={isLoading ? "Loading…" : `${total} ${total === 1 ? "result" : "results"}`}
            view={view}
            onViewChange={changeView}
          />

          {isLoading ? (
            <div className={view === "grid" ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4" : "space-y-4"}>
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : total === 0 ? (
            <EmptyState
              icon={<SearchX />}
              title="Nothing matches that yet"
              description="Try widening your filters, or clear the search to see the whole collection."
              action={
                <Button asChild variant="outline">
                  <Link href="/shop">Clear filters</Link>
                </Button>
              }
            />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
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
    <Suspense fallback={<div className="container-page py-14 text-sm text-muted-foreground">Loading…</div>}>
      <ShopInner />
    </Suspense>
  );
}