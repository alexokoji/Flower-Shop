"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useWishlist } from "@/stores/wishlist";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useCart, effectivePrice } from "@/stores/cart";
import { productImage } from "@/lib/product-image";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import { toast } from "sonner";

export function ProductListRow({ product }: { product: Product }) {
  const inWishlist = useWishlist((s) => s.ids.has(product.id));
  const toggle = useWishlist((s) => s.toggle);
  const hasMounted = useHasMounted();
  const add = useCart((s) => s.add);

  const imageSrc = productImage(product, 0, "400x500");
  const effective = effectivePrice(product);
  const onSale = product.sale_price > 0 && product.sale_price < product.price;

  return (
    <article className="grid grid-cols-[120px_1fr] sm:grid-cols-[180px_1fr_auto] gap-4 sm:gap-6 surface-luxe p-4 sm:p-5">
      <Link href={`/product/${product.slug}`} className="relative aspect-[4/5] rounded-xl overflow-hidden bg-cream-100">
        {imageSrc ? (
          <Image src={imageSrc} alt={product.name} fill className="object-cover" sizes="180px" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cream-200 to-roseGold-100" />
        )}
      </Link>
      <div className="min-w-0">
        <Link href={`/product/${product.slug}`}>
          <h3 className="display-serif text-xl sm:text-2xl line-clamp-2">{product.name}</h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground capitalize">{product.type}</p>
        <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{product.short_description}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-medium">{formatPrice(effective, product.currency)}</span>
          {onSale && <span className="text-xs price-strike">{formatPrice(product.price, product.currency)}</span>}
        </div>
      </div>
      <div className="col-span-2 sm:col-span-1 flex sm:flex-col items-center justify-end gap-2">
        <Button
          size="sm" variant="gold"
          onClick={() => { add(product); toast.success("Added to cart"); }}
        >Add to cart</Button>
        <button
          aria-label="Toggle wishlist" onClick={() => toggle(product.id)}
          className="size-9 grid place-items-center rounded-full border border-border hover:border-roseGold"
        >
          <Heart className={cn("size-4", (hasMounted && inWishlist) ? "fill-roseGold text-roseGold" : "")} />
        </button>
      </div>
    </article>
  );
}