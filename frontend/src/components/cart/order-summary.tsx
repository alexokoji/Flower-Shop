"use client";

import { formatPrice } from "@/lib/utils";

interface Props {
  currency: string;
  subtotal: number;
  shippingTotal?: number;
  taxTotal?: number;
  discountTotal?: number;
  showShippingLabel?: string;
}

export function OrderSummary({
  currency, subtotal, shippingTotal, taxTotal, discountTotal, showShippingLabel,
}: Props) {
  const shipping = shippingTotal ?? 0;
  const discount = discountTotal ?? 0;
  const tax = taxTotal ?? 0;
  const grand = subtotal + shipping + tax - discount;

  return (
    <dl className="space-y-2 text-sm">
      <Row label="Subtotal" value={formatPrice(subtotal, currency)} />
      <Row
        label="Shipping"
        value={shippingTotal == null ? showShippingLabel ?? "Calculated at checkout" : formatPrice(shipping, currency)}
      />
      {tax > 0 && <Row label="Tax" value={formatPrice(tax, currency)} />}
      {discount > 0 && <Row label="Discount" value={`-${formatPrice(discount, currency)}`} className="text-roseGold" />}
      <div className="pt-3 border-t border-border flex justify-between">
        <dt className="font-medium">Total</dt>
        <dd className="display-serif text-xl">{formatPrice(grand, currency)}</dd>
      </div>
    </dl>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={"flex justify-between " + (className ?? "")}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}