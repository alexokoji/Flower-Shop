"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/stores/cart";
import { fileUrl } from "@/lib/pb";
import { Button } from "@/components/ui/button";

const FREE_SHIPPING_THRESHOLD = 250;

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.closeDrawer);
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const currency = useCart((s) => s.currency);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70]",
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={close}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={cn(
          "absolute right-0 top-0 h-full w-full sm:w-[440px] max-w-full",
          "bg-cream-50 dark:bg-ink-950 text-foreground",
          "shadow-2xl border-l border-border",
          "flex flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="size-5 text-roseGold" />
            <h2 className="display-serif text-xl">Your bag</h2>
            <span className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            type="button"
            aria-label="Close cart"
            onClick={close}
            className="p-2 -mr-2 rounded-md hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div className="px-5 py-3 border-b border-border bg-cream-100 dark:bg-card">
            {remainingForFree > 0 ? (
              <p className="text-xs text-muted-foreground">
                You're <span className="font-medium text-foreground">{formatPrice(remainingForFree, currency)}</span> away from free shipping ✦
              </p>
            ) : (
              <p className="text-xs text-roseGold-600 font-medium">
                ✦ You've unlocked free shipping
              </p>
            )}
            <div className="mt-2 h-1 rounded-full bg-cream-200 dark:bg-ink-900 overflow-hidden">
              <div
                className="h-full bg-roseGold transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-16">
              <ShoppingBag className="size-12 text-roseGold mb-4 opacity-60" />
              <p className="display-serif text-2xl">Your bag is empty</p>
              <p className="text-sm text-muted-foreground mt-2">
                Discover hand-tied flowers and fine necklaces.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                <Link
                  href="/shop?type=flower"
                  onClick={close}
                  className="btn-gold !text-xs flex-1"
                >
                  Shop flowers
                </Link>
                <Link
                  href="/shop?type=necklace"
                  onClick={close}
                  className="btn-outline-gold !text-xs flex-1"
                >
                  Shop necklaces
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const img =
                  item.image_url ??
                  (item.image_filename
                    ? fileUrl(
                        { id: item.product_id, collectionId: item.collection_id },
                        item.image_filename,
                        { thumb: "200x250" }
                      )
                    : null);
                return (
                  <li key={item.product_id} className="p-5 flex gap-4">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={close}
                      className="relative size-20 shrink-0 rounded-lg overflow-hidden bg-cream-100"
                    >
                      {img ? (
                        <Image
                          src={img}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-cream-200 to-roseGold-100" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={close}
                        className="display-serif text-sm leading-tight line-clamp-2 hover:text-roseGold"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPrice(item.unit_price, item.currency)}
                      </p>
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <div className="inline-flex items-center border border-border rounded-full">
                          <button
                            aria-label="Decrease"
                            onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                            className="p-1.5 hover:bg-muted rounded-l-full"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="px-3 tabular-nums text-xs">{item.quantity}</span>
                          <button
                            aria-label="Increase"
                            onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                            className="p-1.5 hover:bg-muted rounded-r-full"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <button
                          aria-label="Remove"
                          onClick={() => remove(item.product_id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <p className="font-medium text-sm whitespace-nowrap">
                      {formatPrice(item.unit_price * item.quantity, item.currency)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer with totals + CTA */}
        {items.length > 0 && (
          <footer className="border-t border-border p-5 space-y-3 bg-cream-50 dark:bg-ink-950">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="display-serif text-2xl">
                {formatPrice(subtotal, currency)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Taxes and shipping calculated at checkout.
            </p>
            <Link href="/checkout" onClick={close} className="block">
              <Button variant="gold" size="lg" className="w-full">
                Checkout · {formatPrice(subtotal, currency)}
              </Button>
            </Link>
            <Link
              href="/cart"
              onClick={close}
              className="block text-center text-xs underline underline-offset-4 hover:text-roseGold"
            >
              View full cart
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}