"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import { useWishlist } from "@/stores/wishlist";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { effectivePrice } from "@/stores/cart";
import { productImage } from "@/lib/product-image";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const inWishlist = useWishlist((s) => s.ids.has(product.id));
  const toggle = useWishlist((s) => s.toggle);
  const hasMounted = useHasMounted();

  const imageSrc = productImage(product, 0, "600x750");
  const effective = effectivePrice(product);
  const onSale = product.sale_price > 0 && product.sale_price < product.price;
  const discountPercent = onSale ? Math.round((1 - product.sale_price / product.price) * 100) : null;

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
          {onSale && (
            <span className="absolute top-3 left-3 rounded-full bg-ink-900 text-cream-50 text-[10px] uppercase tracking-widest px-3 py-1">
              -{discountPercent}%
            </span>
          )}
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
              className={cn("size-4", (hasMounted && inWishlist) ? "fill-roseGold text-roseGold" : "text-ink-900 dark:text-foreground")}
            />
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