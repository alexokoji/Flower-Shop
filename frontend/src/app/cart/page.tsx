"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, ShoppingBag, Tag, Truck } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/stores/cart";
import { CartLine } from "@/components/cart/cart-line";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Badge, Field } from "@/components/ui/primitives";
import { estimateShipping } from "@/lib/checkout";
import { COUNTRIES } from "@/data";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const currency = useCart((s) => s.currency);
  const couponCode = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);

  const [coupon, setCouponInput] = useState(couponCode ?? "");
  const [country, setCountry] = useState("US");
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [estimate, setEstimate] = useState<{ fee: number; days: string } | null>(null);
  const [estimating, setEstimating] = useState(false);

  async function runEstimate() {
    if (items.length === 0) return;
    setEstimating(true);
    try {
      const res = await estimateShipping(
        country,
        method,
        items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
      );
      if (!res.eligible) {
        toast.error(res.reason ?? "Unable to ship there.");
        setEstimate(null);
      } else {
        setEstimate({ fee: res.fee ?? 0, days: res.delivery_days ?? "" });
      }
    } finally {
      setEstimating(false);
    }
  }

  function applyCoupon() {
    const code = coupon.trim();
    setCoupon(code || null);
    toast.success(code ? `Coupon "${code.toUpperCase()}" applied at checkout.` : "Coupon removed.");
  }

  const count = items.reduce((n, i) => n + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="container-page py-12 lg:py-16">
        <EmptyState
          icon={<ShoppingBag />}
          title="Your bag is empty"
          description="Nothing here yet. Find something worth sending."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="accent">
                <Link href="/shop?type=flower">Shop flowers</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/shop?type=necklace">Shop jewelry</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <PageHeader
        eyebrow="Your bag"
        title="Cart"
        description="Review your pieces before checkout. Prices are confirmed server-side."
        className="mb-8"
        actions={
          <Badge variant="outline" size="md">
            {count} {count === 1 ? "item" : "items"}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <Card className="divide-y divide-border p-2 sm:p-4">
          {items.map((i) => (
            <CartLine key={i.product_id} item={i} />
          ))}
        </Card>

        {/* Summary rail — sticky so the total stays in view on long carts. */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h2 className="display text-lg">Order summary</h2>
            <div className="mt-4">
              <OrderSummary
                currency={currency}
                subtotal={subtotal}
                shippingTotal={estimate?.fee}
                showShippingLabel={estimate ? undefined : "Estimate below"}
              />
            </div>
            <Button asChild variant="accent" size="lg" block className="mt-5">
              <Link href="/checkout">
                Checkout <ArrowRight />
              </Link>
            </Button>
            <Link
              href="/shop"
              className="mt-3 block text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Continue shopping
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Truck className="size-4 text-accent" /> Shipping estimate
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Field label="Destination">
                <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.iso2} value={c.iso2}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Speed">
                <Select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as "standard" | "express")}
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </Select>
              </Field>
            </div>
            <Button
              variant="outline"
              size="sm"
              block
              className="mt-3"
              onClick={runEstimate}
              disabled={estimating}
            >
              {estimating ? <Loader2 className="animate-spin" /> : "Estimate shipping"}
            </Button>
            {estimate && (
              <p className="mt-3 rounded-xl bg-surface px-3 py-2.5 text-sm">
                <span className="font-medium">{formatPrice(estimate.fee, currency)}</span>
                <span className="text-muted-foreground"> · {estimate.days} days</span>
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Tag className="size-4 text-accent" /> Coupon
            </h3>
            <div className="mt-4 flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="WELCOME10"
              />
              <Button variant="outline" onClick={applyCoupon}>
                Apply
              </Button>
            </div>
            {couponCode && (
              <p className="mt-3 flex items-center gap-2 text-xs">
                <Badge variant="success" size="sm">
                  {couponCode}
                </Badge>
                <span className="text-muted-foreground">will apply at checkout</span>
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Discounts are validated server-side when the order is placed.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
