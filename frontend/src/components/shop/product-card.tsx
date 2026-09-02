"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn, formatPrice } from "@/lib/utils";
import { useWishlist } from "@/stores/wishlist";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { effectivePrice, useCart } from "@/stores/cart";
import { productImage } from "@/lib/product-image";
import { Badge } from "@/components/ui/primitives";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const inWishlist = useWishlist((s) => s.ids.has(product.id));
  const toggle = useWishlist((s) => s.toggle);
  const add = useCart((s) => s.add);
  // Wishlist state is persisted client-side, so it must not drive the first
  // paint or the server and client markup disagree.
  const hasMounted = useHasMounted();

  const imageSrc = productImage(product, 0, "600x750");
  const effective = effectivePrice(product);
  const onSale = product.sale_price > 0 && product.sale_price < product.price;
  const discountPercent = onSale ? Math.round((1 - product.sale_price / product.price) * 100) : null;
  const inStock = product.status === "in_stock" && product.stock_quantity > 0;
  const lowStock = inStock && product.stock_quantity <= (product.low_stock_threshold || 5);

  const onQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    add(product, 1);
    toast.success(`${product.name} added to bag`);
  };

  return (
    <article className="group">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-shadow duration-300 group-hover:shadow-lift">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-coral-100 via-clay-100 to-sage-100" />
          )}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {onSale && <Badge variant="accent" size="sm">−{discountPercent}%</Badge>}
            {lowStock && <Badge variant="warning" size="sm">Low stock</Badge>}
            {!inStock && <Badge variant="neutral" size="sm">Sold out</Badge>}
          </div>

          <button
            type="button"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
            }}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/85 text-foreground shadow-xs backdrop-blur transition-colors hover:bg-card"
          >
            <Heart
              className={cn(
                "size-4 transition-colors",
                hasMounted && inWishlist && "fill-accent text-accent"
              )}
            />
          </button>

          {/* Reveals on hover at desktop; always tappable on touch. */}
          <button
            type="button"
            disabled={!inStock}
            aria-label={inStock ? `Add ${product.name} to bag` : "Out of stock"}
            onClick={onQuickAdd}
            className={cn(
              "absolute inset-x-3 bottom-3 grid h-10 place-items-center rounded-full text-xs font-medium",
              "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              inStock
                ? "bg-primary text-primary-foreground shadow-soft hover:bg-accent lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <Plus className="size-3.5" />
              {inStock ? "Quick add" : "Sold out"}
            </span>
          </button>
        </div>
      </Link>

      <div className="px-0.5 pt-3.5">
        <Link href={`/product/${product.slug}`}>
          <h3 className="display line-clamp-1 text-[0.9375rem] leading-snug transition-colors group-hover:text-accent">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 text-xs capitalize text-muted-foreground">{product.type}</p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold">{formatPrice(effective, product.currency)}</span>
          {onSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.price, product.currency)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
