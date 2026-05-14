"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { pb } from "@/lib/pb";
import { useAuth } from "@/stores/auth";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

function SuccessInner() {
  const params = useSearchParams();
  const orderNumber = params.get("order");
  const user = useAuth((s) => s.user);

  const { data: order } = useQuery({
    queryKey: ["order-by-number", orderNumber],
    enabled: !!orderNumber && !!user,
    queryFn: () => pb().collection("orders").getFirstListItem<Order>(`order_number = "${orderNumber}"`),
  });

  return (
    <div className="container-edge py-20 text-center max-w-2xl mx-auto">
      <CheckCircle2 className="size-14 mx-auto text-roseGold" />
      <h1 className="display-serif text-5xl mt-6">Thank you</h1>
      <p className="text-muted-foreground mt-3">
        Your order is in. We'll send a confirmation email shortly with the details.
      </p>
      {orderNumber && (
        <p className="mt-4 text-sm">
          Order number: <span className="font-medium tracking-wide">{orderNumber}</span>
        </p>
      )}
      {order && (
        <div className="surface-luxe p-6 mt-8 text-left">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Items</dt>
            <dd className="text-right">{order.items?.length ?? 0}</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="text-right font-medium">{formatPrice(order.grand_total, order.currency)}</dd>
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="text-right capitalize">{order.payment_status.replace("_", " ")}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-right capitalize">{order.status.replace("_", " ")}</dd>
          </dl>
        </div>
      )}
      <div className="mt-8 flex gap-3 justify-center">
        {user ? (
          <Link href="/account/orders" className="btn-gold !text-xs">View my orders</Link>
        ) : (
          <Link href="/" className="btn-gold !text-xs">Back to home</Link>
        )}
        <Link href="/shop" className="btn-outline-gold !text-xs">Keep shopping</Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="container-edge py-20 text-center text-sm text-muted-foreground">Loading…</div>}>
      <SuccessInner />
    </Suspense>
  );
}