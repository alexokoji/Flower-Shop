"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { productBySlug } from "@/lib/catalog";
import { useCart, effectivePrice } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductReviews } from "@/components/product/product-reviews";
import { RelatedProducts } from "@/components/product/related-products";
import { productImageList } from "@/lib/product-image";
import { cn, formatPrice } from "@/lib/utils";
import type { FlowerAttributes, NecklaceAttributes, Product } from "@/types";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const { record } = useRecentlyViewed();
  const hasMounted = useHasMounted();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["catalog", "product", slug],
    queryFn: () => productBySlug(slug),
  });

  // Track in recently viewed
  useEffect(() => {
    if (product?.id) record(product.id);
  }, [product?.id, record]);

  const add = useCart((s) => s.add);
  const inWishlist = useWishlist((s) => product && s.ids.has(product.id));
  const toggleWishlist = useWishlist((s) => s.toggle);

  if (isLoading) {
    return (
      <div className="container-page py-12 grid lg:grid-cols-2 gap-10">
        <div className="aspect-square rounded-3xl bg-muted animate-pulse" />
        <div className="space-y-3">
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-10 bg-muted rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse mt-6" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container-page py-20 text-center surface-luxe">
        <p className="display-serif text-2xl">Product not found</p>
        <p className="text-sm text-muted-foreground mt-2">It may have been moved or sold out.</p>
      </div>
    );
  }

  const effective = effectivePrice(product);
  const onSale = product.sale_price > 0 && product.sale_price < product.price;
  const discountPercent = onSale ? Math.round((1 - product.sale_price / product.price) * 100) : null;
  const inStock = product.status === "in_stock" && product.stock_quantity > 0;
  const lowStock = inStock && product.stock_quantity <= product.low_stock_threshold;

  const addToCart = () => {
    add(product, qty);
    toast.success(`${product.name} added to bag`);
  };
  const buyNow = () => {
    add(product, qty);
    router.push("/checkout");
  };

  return (
    <div className="container-page py-10 lg:py-14">
      <nav className="text-xs text-muted-foreground mb-6">
        <a href="/" className="hover:text-roseGold">Home</a>
        <span className="mx-2">/</span>
        <a href={`/shop?type=${product.type}`} className="hover:text-roseGold capitalize">{product.type}s</a>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <ProductGallery
          fullUrls={productImageList(product, "1200x1200")}
          thumbUrls={productImageList(product, "200x200")}
          alt={product.name}
        />

        {/* Sticky buy box — follows scroll on lg+ */}
        <div className="lg:sticky lg:top-28 space-y-6">
          <div>
            <p className="eyebrow">{product.expand?.category?.name ?? product.type}</p>
            <h1 className="display mt-1.5 text-display-lg">{product.name}</h1>
            {product.short_description && (
              <p className="text-muted-foreground mt-3">{product.short_description}</p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="display text-display-md">{formatPrice(effective, product.currency)}</span>
            {onSale && (
              <>
                <span className="text-base text-muted-foreground line-through">
                  {formatPrice(product.price, product.currency)}
                </span>
                <Badge variant="accent">−{discountPercent}% off</Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className={cn("size-2 rounded-full", inStock ? "bg-success" : "bg-destructive")} />
            {inStock ? (
              lowStock ? <span>Only {product.stock_quantity} left in stock</span> : <span>In stock</span>
            ) : <span>Currently out of stock</span>}
          </div>

          <Specs product={product} />

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-border bg-card shadow-xs">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid size-11 place-items-center rounded-l-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Decrease quantity"
              ><Minus className="size-4" /></button>
              <span className="w-10 text-center text-sm tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock_quantity || 99, q + 1))}
                className="grid size-11 place-items-center rounded-r-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Increase quantity"
              ><Plus className="size-4" /></button>
            </div>
            <Button onClick={addToCart} disabled={!inStock} className="flex-1" size="lg" variant="primary">
              Add to bag
            </Button>
            <button
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              onClick={() => toggleWishlist(product.id)}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card shadow-xs transition-colors hover:border-accent/50"
            >
              <Heart className={cn("size-5", hasMounted && inWishlist && "fill-accent text-accent")} />
            </button>
          </div>

          <Button onClick={buyNow} disabled={!inStock} variant="accent" size="lg" block>
            Buy now
          </Button>

          <ul className="grid sm:grid-cols-3 gap-3 pt-2">
            <Perk icon={Truck} label="Insured delivery" sub={product.delivery_estimate || "Worldwide shipping"} />
            <Perk icon={ShieldCheck} label="Secure checkout" sub="Paystack · Flutterwave · Monnify" />
            <Perk icon={Sparkles} label="Hand-finished" sub="Each piece inspected" />
          </ul>
        </div>
      </div>

      {/* Full-width description, breathing space below the buy box */}
      {product.description && (
        <article className="mx-auto mt-16 max-w-3xl border-t border-border pt-10 lg:mt-24">
          <h2 className="display mb-4 text-display-sm">Details</h2>
          <div
            className="text-[0.9375rem] leading-relaxed text-muted-foreground [&_p]:mb-4 [&_strong]:text-foreground"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </article>
      )}

      <div className="mt-16">
        <ProductReviews productId={product.id} ratingAvg={product.rating_avg} ratingCount={product.rating_count} />
      </div>

      <RelatedProducts product={product} />
    </div>
  );
}

function Specs({ product }: { product: Product }) {
  const a = product.attributes ?? {};
  if (product.type === "flower") {
    const f = a as FlowerAttributes;
    const rows: Array<[string, string | undefined]> = [
      ["Flower type", f.flower_type],
      ["Color", f.color],
      ["Occasion", f.occasion],
      ["Freshness", f.freshness_days ? `${f.freshness_days} days` : undefined],
      ["Care", f.care_instructions],
    ];
    return <SpecList rows={rows} />;
  }
  if (product.type === "necklace") {
    const n = a as NecklaceAttributes;
    const rows: Array<[string, string | undefined]> = [
      ["Material", n.material],
      ["Stone", n.stone_type],
      ["Chain length", n.chain_length_cm ? `${n.chain_length_cm} cm` : undefined],
      ["Gender", n.gender],
      ["Weight", n.weight_g ? `${n.weight_g} g` : undefined],
      ["Color", n.color],
    ];
    return <SpecList rows={rows} />;
  }
  return null;
}

function SpecList({ rows }: { rows: Array<[string, string | undefined]> }) {
  const filtered = rows.filter(([, v]) => v != null && v !== "");
  if (filtered.length === 0) return null;
  return (
    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm border-t border-border pt-4">
      {filtered.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Perk({ icon: Icon, label, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; sub: string }) {
  return (
    <li className="surface-luxe p-4 flex items-start gap-3">
      <Icon className="size-5 text-roseGold shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </li>
  );
}