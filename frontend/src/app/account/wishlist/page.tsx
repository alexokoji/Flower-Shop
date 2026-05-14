"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useWishlist } from "@/stores/wishlist";
import { useCart } from "@/stores/cart";
import { pb } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/types";

export default function WishlistPage() {
  const ids = useWishlist((s) => Array.from(s.ids));
  const toggle = useWishlist((s) => s.toggle);
  const clear = useWishlist((s) => s.clear);
  const add = useCart((s) => s.add);

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist-products", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const filter = ids.map((id) => `id = "${id}"`).join(" || ");
      return pb().collection("products").getFullList<Product>({ filter, expand: "category" });
    },
  });

  if (ids.length === 0) {
    return (
      <div className="surface-luxe p-12 text-center">
        <p className="display-serif text-2xl">Nothing saved yet</p>
        <p className="text-sm text-muted-foreground mt-2">Tap the heart on any product to save it for later.</p>
        <Link href="/shop" className="btn-gold !text-xs inline-flex mt-5">Browse the shop</Link>
      </div>
    );
  }

  function moveAllToCart() {
    let count = 0;
    (data ?? []).forEach((p) => {
      if (p.status === "in_stock" && p.stock_quantity > 0) {
        add(p, 1);
        count++;
      }
    });
    if (count > 0) toast.success(`${count} item${count === 1 ? "" : "s"} added to cart`);
    else toast.error("None of these are in stock right now.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="display-serif text-2xl">Wishlist ({ids.length})</h2>
        <div className="flex gap-2">
          <Button onClick={moveAllToCart} variant="gold" size="sm" disabled={!data || data.length === 0}>
            <ShoppingBag className="size-4" /> Add all to cart
          </Button>
          <Button onClick={() => clear()} variant="outline" size="sm" className="text-destructive border-destructive/40">
            <Trash2 className="size-4" /> Clear
          </Button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {data?.map((p) => (
            <div key={p.id} className="relative">
              <ProductCard product={p} />
              <button
                onClick={() => toggle(p.id)}
                className="absolute -top-1 -right-1 size-7 grid place-items-center rounded-full bg-background border border-border text-destructive opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                aria-label="Remove from wishlist"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}