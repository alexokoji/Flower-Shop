"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

const STATUSES: Order["status"][] = [
  "pending","paid","processing","packed","shipped","in_transit","delivered","cancelled","refunded",
];
const PAYMENT_STATUSES: Order["payment_status"][] = [
  "unpaid","paid","partially_refunded","refunded","failed",
];

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => pb().collection("orders").getOne<Order>(id),
  });

  const [status, setStatus] = useState<Order["status"]>("pending");
  const [paymentStatus, setPaymentStatus] = useState<Order["payment_status"]>("unpaid");
  const [trackingId, setTrackingId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (!order) return;
    setStatus(order.status);
    setPaymentStatus(order.payment_status);
    setTrackingId((order as Order & { tracking_id?: string }).tracking_id ?? "");
    setAdminNotes((order as Order & { admin_notes?: string }).admin_notes ?? "");
  }, [order]);

  const save = useMutation({
    mutationFn: () =>
      pb().collection("orders").update<Order>(id, {
        status,
        payment_status: paymentStatus,
        tracking_id: trackingId,
        admin_notes: adminNotes,
      }),
    onSuccess: () => {
      toast.success("Order updated.");
      qc.invalidateQueries({ queryKey: ["admin", "order", id] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: () => toast.error("Update failed."),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading order…</p>;
  if (isError || !order) {
    return (
      <div className="space-y-4">
        <Link href="/admin/orders" className="inline-flex items-center text-sm hover:text-roseGold">
          <ArrowLeft className="size-4 mr-1" /> All orders
        </Link>
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  const shipping = order.shipping_address as Record<string, string>;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/orders" className="inline-flex items-center text-sm hover:text-roseGold">
        <ArrowLeft className="size-4 mr-1" /> All orders
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="display-serif text-3xl lg:text-4xl mt-2">{order.order_number}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Placed {new Date(order.placed_at || order.created).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="display-serif text-2xl">{formatPrice(order.grand_total, order.currency)}</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <section className="surface-luxe p-6 lg:p-8 space-y-4">
          <h2 className="display-serif text-xl">Items</h2>
          <ul className="divide-y divide-border">
            {(order.items ?? []).map((it, idx) => (
              <li key={`${it.product_id}-${idx}`} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{it.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.product_sku} · {it.product_type} · qty {it.quantity}
                  </p>
                </div>
                <p className="font-medium">{formatPrice(it.line_total, order.currency)}</p>
              </li>
            ))}
          </ul>
          <dl className="pt-2 space-y-1 text-sm border-t border-border">
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

        <aside className="space-y-6">
          <section className="surface-luxe p-5 space-y-3">
            <h3 className="font-medium">Update</h3>
            <div className="space-y-1.5">
              <Label>Order status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Order["status"])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as Order["payment_status"])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Tracking ID</Label>
              <Input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Admin notes</Label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={() => save.mutate()} variant="gold" disabled={save.isPending} className="w-full">
              <Save className="size-4" /> {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </section>

          <section className="surface-luxe p-5 space-y-2 text-sm">
            <h3 className="font-medium">Shipping</h3>
            <address className="not-italic text-muted-foreground whitespace-pre-line text-xs">
              {shipping?.first_name} {shipping?.last_name}
              {`\n${shipping?.street_address ?? ""}${shipping?.apartment ? `, ${shipping.apartment}` : ""}`}
              {`\n${shipping?.city ?? ""}, ${shipping?.state ?? ""} ${shipping?.postal_code ?? ""}`}
              {`\n${shipping?.country_iso2 ?? ""}`}
              {shipping?.phone && `\n${shipping.phone}`}
            </address>
            <p className="text-xs"><span className="text-muted-foreground">Method:</span> <span className="capitalize">{order.shipping_method}</span></p>
          </section>

          <section className="surface-luxe p-5 space-y-2 text-sm">
            <h3 className="font-medium">Payment</h3>
            <p className="text-xs capitalize text-muted-foreground">
              {order.payment_provider || "—"} · {order.payment_status.replace("_", " ")}
            </p>
            {order.payment_reference && (
              <p className="text-xs text-muted-foreground">Ref: <span className="font-mono">{order.payment_reference}</span></p>
            )}
          </section>
        </aside>
      </div>
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