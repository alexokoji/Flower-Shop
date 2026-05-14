"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/stores/auth";
import { pb } from "@/lib/pb";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-muted text-foreground",
  paid: "bg-roseGold/15 text-roseGold-600",
  processing: "bg-roseGold/15 text-roseGold-600",
  packed: "bg-roseGold/15 text-roseGold-600",
  shipped: "bg-gold/15 text-gold-500",
  in_transit: "bg-gold/15 text-gold-500",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-destructive/10 text-destructive",
};

export default function OrdersListPage() {
  const userId = useAuth((s) => s.user?.id);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", userId],
    enabled: !!userId,
    queryFn: () => pb().collection("orders").getFullList<Order>({
      filter: `user = "${userId}"`,
      sort: "-created",
    }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading orders…</p>;

  if (!data || data.length === 0) {
    return (
      <div className="surface-luxe p-12 text-center">
        <p className="display-serif text-2xl">No orders yet</p>
        <p className="text-sm text-muted-foreground mt-2">When you place an order, it will appear here with full tracking.</p>
        <Link href="/shop" className="btn-gold !text-xs inline-flex mt-5">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="display-serif text-2xl">My orders</h2>
      <ul className="space-y-4">
        {data.map((o) => (
          <li key={o.id} className="surface-luxe p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Order</p>
                <p className="font-medium tracking-wide">{o.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Placed</p>
                <p className="text-sm">{new Date(o.placed_at || o.created).toLocaleDateString()}</p>
              </div>
              <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_TONE[o.status] ?? "bg-muted"}`}>
                {o.status.replace("_", " ")}
              </span>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-medium">{formatPrice(o.grand_total, o.currency)}</p>
              </div>
              <Link href={`/account/orders/${o.id}`} className="btn-outline-gold !text-xs">View</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}