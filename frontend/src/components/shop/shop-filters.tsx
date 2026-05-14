"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { categories } from "@/lib/catalog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FLOWER_OCCASIONS = ["Wedding", "Birthday", "Valentine", "Anniversary", "Funeral", "Graduation"];
const FLOWER_COLORS = ["red", "white", "pink", "yellow", "gold", "purple"];
const NECKLACE_COLORS = ["Gold", "Rose Gold", "White Gold", "Silver", "Black"];

interface Props {
  type?: "flower" | "necklace";
}

export function ShopFilters({ type }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(params.get("min_price") ?? "");
  const [max, setMax] = useState(params.get("max_price") ?? "");

  useEffect(() => {
    setMin(params.get("min_price") ?? "");
    setMax(params.get("max_price") ?? "");
  }, [params]);

  const cats = useQuery({
    queryKey: ["categories", type],
    queryFn: () => categories(type),
    staleTime: 60 * 60_000,
  });

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (value && value.length) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`?${next.toString()}`);
  }

  function reset() {
    const next = new URLSearchParams();
    if (type) next.set("type", type);
    router.push(`?${next.toString()}`);
  }

  const activeCategory = params.get("category") ?? "";
  const activeColor = params.get("color") ?? "";
  const activeOccasion = params.get("occasion") ?? "";
  const inStock = params.get("in_stock") === "true";

  const Section = (
    <div className="space-y-6">
      <div>
        <h4 className="eyebrow mb-3">Category</h4>
        <ul className="space-y-1.5 text-sm">
          <li>
            <button
              className={"hover:text-roseGold " + (activeCategory === "" ? "text-roseGold" : "")}
              onClick={() => update("category", null)}
            >All</button>
          </li>
          {cats.data?.map((c) => (
            <li key={c.id}>
              <button
                className={"hover:text-roseGold " + (activeCategory === c.slug ? "text-roseGold" : "")}
                onClick={() => update("category", c.slug)}
              >{c.name}</button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="eyebrow mb-3">Price</h4>
        <div className="flex items-center gap-2">
          <Input
            type="number" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)}
            onBlur={() => update("min_price", min)} className="h-9"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)}
            onBlur={() => update("max_price", max)} className="h-9"
          />
        </div>
      </div>

      {type === "flower" && (
        <div>
          <h4 className="eyebrow mb-3">Occasion</h4>
          <ul className="space-y-1.5 text-sm">
            <li>
              <button
                className={"hover:text-roseGold " + (activeOccasion === "" ? "text-roseGold" : "")}
                onClick={() => update("occasion", null)}
              >All</button>
            </li>
            {FLOWER_OCCASIONS.map((o) => (
              <li key={o}>
                <button
                  className={"hover:text-roseGold " + (activeOccasion === o ? "text-roseGold" : "")}
                  onClick={() => update("occasion", o)}
                >{o}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="eyebrow mb-3">Color</h4>
        <div className="flex flex-wrap gap-2">
          {(type === "necklace" ? NECKLACE_COLORS : FLOWER_COLORS).map((c) => (
            <button
              key={c}
              onClick={() => update("color", activeColor === c ? null : c)}
              className={
                "rounded-full border px-3 py-1 text-xs transition-colors " +
                (activeColor === c
                  ? "bg-ink-900 text-cream-50 border-ink-900"
                  : "border-border hover:border-roseGold hover:text-roseGold")
              }
            >{c}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox" checked={inStock}
            onChange={(e) => update("in_stock", e.target.checked ? "true" : null)}
            className="size-4 accent-roseGold"
          />
          In stock only
        </label>
      </div>

      <Button variant="outline" size="sm" onClick={reset}>Reset filters</Button>
    </div>
  );

  return (
    <>
      <button
        className="lg:hidden btn-outline-gold !py-2 !px-4 !text-xs w-full mb-4"
        onClick={() => setOpen(true)}
      >Filter & sort</button>

      <aside className="hidden lg:block">{Section}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-background p-6 overflow-y-auto shadow-luxe">
            <div className="flex items-center justify-between mb-6">
              <h3 className="display-serif text-2xl">Filter</h3>
              <button onClick={() => setOpen(false)} className="text-sm hover:text-roseGold">Close</button>
            </div>
            {Section}
          </aside>
        </div>
      )}
    </>
  );
}