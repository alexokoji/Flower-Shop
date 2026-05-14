"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Grid2x2, List, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  totalLabel: string;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
}

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function ShopToolbar({ totalLabel, view, onViewChange }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => { setQ(params.get("q") ?? ""); }, [params]);

  const sort = params.get("sort") ?? "popular";

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value && value.length) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{totalLabel}</p>

      <form
        onSubmit={(e) => { e.preventDefault(); update("q", q); }}
        className="flex items-center gap-2 flex-1 sm:flex-none sm:w-72"
      >
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full h-10 pl-9 pr-3 rounded-full border border-border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <select
          value={sort} onChange={(e) => update("sort", e.target.value)}
          className="h-10 px-3 rounded-full border border-border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="hidden sm:flex items-center border border-border rounded-full overflow-hidden">
          <button
            aria-label="Grid view" onClick={() => onViewChange("grid")}
            className={"p-2 " + (view === "grid" ? "bg-ink-900 text-cream-50" : "hover:bg-muted")}
          >
            <Grid2x2 className="size-4" />
          </button>
          <button
            aria-label="List view" onClick={() => onViewChange("list")}
            className={"p-2 " + (view === "list" ? "bg-ink-900 text-cream-50" : "hover:bg-muted")}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}