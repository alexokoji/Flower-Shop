"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn, formatPrice } from "@/lib/utils";
import { useWishlist } from "@/stores/wishlist";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { effectivePrice, useCart } from "@/stores/cart";
import { productImage } from "@/lib/product-image";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const inWishlist = useWishlist((s) => s.ids.has(product.id));
  const toggle = useWishlist((s) => s.toggle);
  const add = useCart((s) => s.add);
  const hasMounted = useHasMounted();

  const imageSrc = productImage(product, 0, "600x750");
  const effective = effectivePrice(product);
  const onSale = product.sale_price > 0 && product.sale_price < product.price;
  const discountPercent = onSale ? Math.round((1 - product.sale_price / product.price) * 100) : null;
  const inStock = product.status === "in_stock" && product.stock_quantity > 0;

  const onQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    add(product, 1);
    toast.success(`${product.name} added to bag`);
  };

  return (
    <motion.article whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="group">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-100 dark:bg-card">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-cream-200 via-softPink-100 to-roseGold-100" />
          )}

          {/* Sale badge */}
          {onSale && (
            <span className="absolute top-3 left-3 rounded-full bg-ink-900 text-cream-50 text-[10px] uppercase tracking-widest px-3 py-1">
              -{discountPercent}%
            </span>
          )}

          {/* Wishlist heart */}
          <button
            type="button"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
            }}
            className={cn(
              "absolute top-3 right-3 grid place-items-center size-9 rounded-full backdrop-blur",
              "bg-cream-50/80 dark:bg-card/80 hover:bg-cream-50 transition-colors"
            )}
          >
            <Heart
              className={cn(
                "size-4",
                (hasMounted && inWishlist)
                  ? "fill-roseGold text-roseGold"
                  : "text-ink-900 dark:text-foreground"
              )}
            />
          </button>

          {/* Quick-add — slides up on hover, full-width tap target on mobile */}
          <button
            type="button"
            disabled={!inStock}
            aria-label={inStock ? `Add ${product.name} to bag` : "Out of stock"}
            onClick={onQuickAdd}
            className={cn(
              "absolute left-3 right-3 bottom-3 grid place-items-center h-10",
              "rounded-full bg-ink-900 text-cream-50 text-xs font-medium",
              "transition-all duration-300",
              inStock
                ? "lg:opacity-0 lg:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-roseGold"
                : "opacity-100 bg-muted-foreground/40 cursor-not-allowed"
            )}
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="size-3.5" />
              {inStock ? "Quick add" : "Sold out"}
            </span>
          </button>
        </div>
      </Link>

      <div className="pt-3 px-1">
        <Link href={`/product/${product.slug}`}>
          <h3 className="display-serif text-lg leading-tight line-clamp-2">{product.name}</h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground capitalize">{product.type}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-medium">{formatPrice(effective, product.currency)}</span>
          {onSale && (
            <span className="text-xs price-strike">{formatPrice(product.price, product.currency)}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}