"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import { pb } from "@/lib/pb";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

const TIMELINE: Array<{ key: string; label: string }> = [
  { key: "pending", label: "Order placed" },
  { key: "paid", label: "Payment confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Dispatched" },
  { key: "in_transit", label: "In transit" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => pb().collection("orders").getOne<Order>(id),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading order…</p>;
  if (isError || !order) {
    return (
      <div className="surface-luxe p-12 text-center">
        <p className="display-serif text-2xl">Order not found</p>
        <Link href="/account/orders" className="btn-outline-gold !text-xs inline-flex mt-4">Back to orders</Link>
      </div>
    );
  }

  const currentIdx = Math.max(0, TIMELINE.findIndex((t) => t.key === order.status));

  const shipping = order.shipping_address as Record<string, string>;

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center text-sm hover:text-roseGold">
        <ArrowLeft className="size-4 mr-1" /> All orders
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Order</p>
          <h2 className="display-serif text-3xl tracking-wide">{order.order_number}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Placed {new Date(order.placed_at || order.created).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="display-serif text-2xl">{formatPrice(order.grand_total, order.currency)}</p>
        </div>
      </header>

      <section className="surface-luxe p-6 lg:p-8">
        <h3 className="font-medium mb-5">Tracking timeline</h3>
        <ol className="space-y-3">
          {TIMELINE.map((step, i) => {
            const passed = i < currentIdx || (order.status === step.key);
            const current = order.status === step.key;
            return (
              <li key={step.key} className="flex items-center gap-3">
                {passed ? (
                  <CheckCircle2 className={current ? "size-5 text-roseGold" : "size-5 text-emerald-600"} />
                ) : i === currentIdx + 1 ? (
                  <Clock className="size-5 text-muted-foreground" />
                ) : (
                  <Circle className="size-5 text-muted-foreground/40" />
                )}
                <span className={passed ? "font-medium" : "text-muted-foreground"}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="surface-luxe p-6 lg:p-8 space-y-4">
        <h3 className="font-medium">Items</h3>
        <ul className="divide-y divide-border">
          {(order.items ?? []).map((it, idx) => (
            <li key={`${it.product_id}-${idx}`} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{it.product_name}</p>
                <p className="text-xs text-muted-foreground">{it.product_sku} · qty {it.quantity}</p>
              </div>
              <p className="font-medium">{formatPrice(it.line_total, order.currency)}</p>
            </li>
          ))}
        </ul>
        <dl className="pt-2 space-y-1 text-sm">
          <Row label="Subtotal" value={formatPrice(order.subtotal, order.currency)} />
          <Row label="Shipping" value={formatPrice(order.shipping_total, order.currency)} />
          {order.tax_total > 0 && <Row label="Tax" value={formatPrice(order.tax_total, order.currency)} />}
          {order.discount_total > 0 && <Row label="Discount" value={`-${formatPrice(order.discount_total, order.currency)}`} />}
          <div className="flex justify-between pt-2 border-t border-border">
            <dt className="font-medium">Total</dt>
            <dd className="display-serif text-lg">{formatPrice(order.grand_total, order.currency)}</dd>
          </div>
        </dl>
      </section>

      <section className="surface-luxe p-6 lg:p-8 grid sm:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium">Shipping to</h3>
          <address className="not-italic text-sm text-muted-foreground mt-2 whitespace-pre-line">
            {shipping?.first_name} {shipping?.last_name}
            {`\n${shipping?.street_address ?? ""}${shipping?.apartment ? `, ${shipping.apartment}` : ""}`}
            {`\n${shipping?.city ?? ""}, ${shipping?.state ?? ""} ${shipping?.postal_code ?? ""}`}
            {`\n${shipping?.country_iso2 ?? ""}`}
            {shipping?.phone && `\n${shipping.phone}`}
          </address>
        </div>
        <div>
          <h3 className="font-medium">Payment</h3>
          <p className="text-sm text-muted-foreground mt-2 capitalize">
            {order.payment_provider || "—"} · {order.payment_status.replace("_", " ")}
          </p>
          <h3 className="font-medium mt-4">Method</h3>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{order.shipping_method}</p>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}