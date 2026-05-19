"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { pb } from "@/lib/pb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

const STATUS_OPTIONS: Order["status"][] = [
  "pending","paid","processing","packed","shipped","in_transit","delivered","cancelled","refunded",
];

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

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  const parts: string[] = [];
  if (q) parts.push(`(order_number ~ "${q.replace(/"/g, '\\"')}" || guest_email ~ "${q.replace(/"/g, '\\"')}")`);
  if (status) parts.push(`status = "${status}"`);
  if (paymentStatus) parts.push(`payment_status = "${paymentStatus}"`);
  const filter = parts.join(" && ");

  const list = useQuery({
    queryKey: ["admin", "orders", page, q, status, paymentStatus],
    queryFn: () => pb().collection("orders").getList<Order>(page, 20, {
      filter,
      sort: "-created",
    }),
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Operations</p>
        <h1 className="display-serif text-3xl lg:text-4xl mt-2">Orders</h1>
      </header>

      <div className="surface-luxe p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by order # or guest email…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">Any payment</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <section className="surface-luxe overflow-hidden">
        {list.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (list.data?.totalItems ?? 0) === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">No orders match these filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground bg-cream-100/40 dark:bg-card/40">
              <tr className="text-left">
                <th className="p-3">Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Placed</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data?.items.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className="p-3 font-medium">{o.order_number}</td>
                  <td className="text-xs text-muted-foreground">
                    {o.user ? <span className="text-foreground">User</span> : o.guest_email || "—"}
                  </td>
                  <td>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${STATUS_TONE[o.status] ?? "bg-muted"}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-muted">
                      {o.payment_status.replace("_", " ")}
                    </span>
                  </td>
                  <td>{formatPrice(o.grand_total, o.currency)}</td>
                  <td className="text-xs text-muted-foreground">
                    {new Date(o.placed_at || o.created).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-xs underline underline-offset-4 hover:text-roseGold">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {list.data && list.data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {list.data.page} of {list.data.totalPages} · {list.data.totalItems} total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= list.data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}