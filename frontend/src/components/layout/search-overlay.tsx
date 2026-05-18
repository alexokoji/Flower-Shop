"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { listProducts, featuredProducts } from "@/lib/catalog";
import { useSearchOverlay } from "@/stores/search-overlay";
import { productImage } from "@/lib/product-image";
import { effectivePrice } from "@/stores/cart";
import { formatPrice, cn } from "@/lib/utils";

const RECENT_KEY = "fs-recent-searches";
const MAX_RECENT = 5;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}
function pushRecent(term: string) {
  if (typeof window === "undefined" || !term.trim()) return;
  const next = [term, ...readRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_RECENT);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function SearchOverlay() {
  const isOpen = useSearchOverlay((s) => s.isOpen);
  const close = useSearchOverlay((s) => s.close);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened, clear on close, lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    setRecent(readRecent());
    setTimeout(() => inputRef.current?.focus(), 50);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) { setQ(""); setDebounced(""); }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  // Live results
  const results = useQuery({
    queryKey: ["catalog", "search-overlay", debounced],
    queryFn: () => listProducts({ q: debounced, per_page: 6 }),
    enabled: isOpen && debounced.length >= 2,
  });

  // Popular fallback (no query)
  const popular = useQuery({
    queryKey: ["catalog", "search-overlay", "popular"],
    queryFn: () => featuredProducts(undefined, 6),
    enabled: isOpen && debounced.length < 2,
  });

  function commitSearch(term: string) {
    if (!term.trim()) return;
    pushRecent(term);
    close();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  const showResults = debounced.length >= 2;
  const items = useMemo(() => (showResults ? results.data?.items : popular.data) ?? [], [showResults, results.data, popular.data]);

  return (
    <div
      className={cn("fixed inset-0 z-[75]", isOpen ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(
          "absolute inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={close}
      />
      <div
        className={cn(
          "absolute top-0 inset-x-0 bg-cream-50 dark:bg-ink-950 shadow-luxe border-b border-border",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="container-edge py-5 lg:py-8">
          <form
            onSubmit={(e) => { e.preventDefault(); commitSearch(q); }}
            className="relative max-w-2xl mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search flowers, necklaces, occasions…"
              className="w-full h-14 pl-12 pr-12 rounded-full border border-border bg-background text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={close}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="size-5" />
            </button>
          </form>

          <div className="mt-6 max-w-3xl mx-auto">
            {showResults ? (
              <div className="flex items-center justify-between text-xs">
                <p className="text-muted-foreground">
                  {results.isLoading ? "Searching…" : `${results.data?.totalItems ?? 0} results for "${debounced}"`}
                </p>
                <button
                  onClick={() => commitSearch(q)}
                  className="hover:text-roseGold underline underline-offset-4"
                >
                  See all results →
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                {recent.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                      <Clock className="size-3.5" /> Recent
                    </div>
                    <ul className="space-y-1">
                      {recent.map((r) => (
                        <li key={r}>
                          <button
                            onClick={() => { setQ(r); commitSearch(r); }}
                            className="text-sm hover:text-roseGold"
                          >
                            {r}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                    <TrendingUp className="size-3.5" /> Popular
                  </div>
                  <ul className="space-y-1">
                    {["Red roses", "Wedding bouquets", "Diamond necklace", "Pearl choker", "Sunflowers"].map((p) => (
                      <li key={p}>
                        <button
                          onClick={() => { setQ(p); commitSearch(p); }}
                          className="text-sm hover:text-roseGold"
                        >
                          {p}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {items.map((p) => {
                const img = productImage(p, 0, "200x250");
                const price = effectivePrice(p);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={close}
                      className="flex gap-3 p-2 rounded-lg hover:bg-muted/60"
                    >
                      <div className="relative size-16 shrink-0 rounded-md overflow-hidden bg-cream-100">
                        {img ? (
                          <Image src={img} alt={p.name} fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-cream-200 to-roseGold-100" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm display-serif line-clamp-2">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatPrice(price, p.currency)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}