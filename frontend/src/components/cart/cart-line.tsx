"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { fileUrl } from "@/lib/pb";
import { useCart, type LocalCartItem } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";

export function CartLine({ item, compact = false }: { item: LocalCartItem; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  const img =
    item.image_url ??
    (item.image_filename
      ? fileUrl({ id: item.product_id, collectionId: item.collection_id }, item.image_filename, { thumb: "200x250" })
      : null);

  return (
    <div className={"grid " + (compact ? "grid-cols-[64px_1fr_auto]" : "grid-cols-[80px_1fr_auto] sm:grid-cols-[120px_1fr_auto]") + " gap-4 py-4 border-b border-border last:border-0"}>
      <Link href={`/product/${item.slug}`} className={"relative aspect-[4/5] rounded-lg overflow-hidden bg-cream-100 " + (compact ? "h-20" : "")}>
        {img ? (
          <Image src={img} alt={item.name} fill className="object-cover" sizes="120px" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cream-200 to-roseGold-100" />
        )}
      </Link>
      <div className="min-w-0">
        <Link href={`/product/${item.slug}`} className="font-medium line-clamp-2 hover:text-roseGold">{item.name}</Link>
        <p className="text-xs text-muted-foreground mt-1">{formatPrice(item.unit_price, item.currency)} each</p>
        {!compact && (
          <div className="mt-3 inline-flex items-center border border-border rounded-full overflow-hidden">
            <button
              aria-label="Decrease" onClick={() => setQuantity(item.product_id, item.quantity - 1)}
              className="p-2 hover:bg-muted"
            ><Minus className="size-3" /></button>
            <span className="px-3 tabular-nums text-sm">{item.quantity}</span>
            <button
              aria-label="Increase" onClick={() => setQuantity(item.product_id, item.quantity + 1)}
              className="p-2 hover:bg-muted"
            ><Plus className="size-3" /></button>
          </div>
        )}
      </div>
      <div className="text-right flex flex-col items-end justify-between">
        <button
          aria-label="Remove" onClick={() => remove(item.product_id)}
          className="text-muted-foreground hover:text-destructive"
        ><X className="size-4" /></button>
        <p className="font-medium">{formatPrice(item.unit_price * item.quantity, item.currency)}</p>
        {compact && <p className="text-xs text-muted-foreground">× {item.quantity}</p>}
      </div>
    </div>
  );
}