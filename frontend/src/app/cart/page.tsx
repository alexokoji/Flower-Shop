"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/stores/cart";
import { CartLine } from "@/components/cart/cart-line";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { estimateShipping } from "@/lib/checkout";
import { COUNTRIES } from "@/data";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

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
        items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
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
    setCoupon(coupon.trim() || null);
    toast.success(coupon.trim() ? `Coupon "${coupon.trim().toUpperCase()}" applied at checkout.` : "Coupon removed.");
  }

  if (items.length === 0) {
    return (
      <div className="container-edge py-20 text-center">
        <ShoppingBag className="size-12 mx-auto text-roseGold mb-4" />
        <h1 className="display-serif text-4xl">Your cart is empty</h1>
        <p className="text-sm text-muted-foreground mt-2">Find something to fall in love with.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <Link href="/shop?type=flower" className="btn-gold !text-xs">Shop flowers</Link>
          <Link href="/shop?type=necklace" className="btn-outline-gold !text-xs">Shop necklaces</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-edge py-10 lg:py-14">
      <header className="mb-8">
        <p className="eyebrow">Bag</p>
        <h1 className="display-serif text-4xl lg:text-5xl mt-2">Your cart</h1>
      </header>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10">
        <section className="surface-luxe p-2 sm:p-6">
          {items.map((i) => <CartLine key={i.product_id} item={i} />)}
        </section>

        <aside className="space-y-6">
          <section className="surface-luxe p-6">
            <h2 className="display-serif text-xl mb-4">Order summary</h2>
            <OrderSummary
              currency={currency}
              subtotal={subtotal}
              shippingTotal={estimate?.fee}
              showShippingLabel={estimate ? undefined : "Enter country to estimate"}
            />
            <Link href="/checkout" className="block">
              <Button className="w-full mt-5" size="lg" variant="gold">Checkout</Button>
            </Link>
            <Link href="/shop" className="block text-center text-sm mt-3 hover:text-roseGold">Continue shopping</Link>
          </section>

          <section className="surface-luxe p-6 space-y-3">
            <h3 className="font-medium">Shipping estimate</h3>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <select
                value={country} onChange={(e) => setCountry(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {COUNTRIES.map((c) => <option key={c.iso2} value={c.iso2}>{c.name}</option>)}
              </select>
              <select
                value={method} onChange={(e) => setMethod(e.target.value as "standard" | "express")}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={runEstimate} disabled={estimating} className="w-full">
              {estimating ? "Calculating…" : "Estimate"}
            </Button>
            {estimate && (
              <p className="text-sm text-muted-foreground">
                {formatPrice(estimate.fee, currency)} · {estimate.days} days
              </p>
            )}
          </section>

          <section className="surface-luxe p-6 space-y-3">
            <h3 className="font-medium">Coupon code</h3>
            <div className="flex gap-2">
              <Input
                value={coupon} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="WELCOME10"
              />
              <Button variant="outline" onClick={applyCoupon}>Apply</Button>
            </div>
            {couponCode && (
              <p className="text-xs text-muted-foreground">Active: <span className="font-medium">{couponCode}</span></p>
            )}
            <p className="text-xs text-muted-foreground">Discount is calculated and validated at checkout.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}