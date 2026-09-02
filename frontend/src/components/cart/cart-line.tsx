"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";

import { fileUrl } from "@/lib/pb";
import { useCart, type LocalCartItem } from "@/stores/cart";
import { formatPrice, cn } from "@/lib/utils";

export function CartLine({ item, compact = false }: { item: LocalCartItem; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

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
    <div
      className={cn(
        "grid items-start gap-4 py-4",
        compact ? "grid-cols-[64px_1fr_auto]" : "grid-cols-[84px_1fr_auto] sm:grid-cols-[104px_1fr_auto]"
      )}
    >
      <Link
        href={`/product/${item.slug}`}
        className={cn(
          "relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-surface",
          compact && "h-20"
        )}
      >
        {img ? (
          <Image src={img} alt={item.name} fill className="object-cover" sizes="104px" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-coral-100 to-clay-200" />
        )}
      </Link>

      <div className="min-w-0">
        <Link
          href={`/product/${item.slug}`}
          className="display line-clamp-2 text-[0.9375rem] leading-snug transition-colors hover:text-accent"
        >
          {item.name}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatPrice(item.unit_price, item.currency)} each
        </p>

        {!compact && (
          <div className="mt-3 inline-flex items-center rounded-full border border-border bg-card shadow-xs">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity(item.product_id, item.quantity - 1)}
              className="grid size-8 place-items-center rounded-l-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-8 px-1 text-center text-sm tabular-nums">{item.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity(item.product_id, item.quantity + 1)}
              className="grid size-8 place-items-center rounded-r-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex h-full flex-col items-end justify-between gap-3">
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          onClick={() => remove(item.product_id)}
          className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-4" />
        </button>
        <div className="text-right">
          <p className="text-sm font-semibold">
            {formatPrice(item.unit_price * item.quantity, item.currency)}
          </p>
          {compact && <p className="text-xs text-muted-foreground">× {item.quantity}</p>}
        </div>
      </div>
    </div>
  );
}
