"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, Users, AlertTriangle, TrendingUp, Banknote } from "lucide-react";
import { pb } from "@/lib/pb";
import { formatPrice } from "@/lib/utils";
import type { Order, Product, User } from "@/types";

export default function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [paidOrders, allOrders, customers, lowStock, bestSellers] = await Promise.all([
        pb().collection("orders").getFullList<Order>({ filter: 'payment_status = "paid"', fields: "grand_total,currency" }),
        pb().collection("orders").getList<Order>(1, 1, { fields: "id" }),
        pb().collection("users").getList<User>(1, 1, { filter: 'role = "customer"', fields: "id" }),
        pb().collection("products").getList<Product>(1, 8, {
          filter: "stock_quantity <= low_stock_threshold && stock_quantity > 0",
          fields: "id,name,sku,stock_quantity,low_stock_threshold,slug",
        }),
        pb().collection("products").getList<Product>(1, 5, {
          sort: "-sales_count",
          fields: "id,name,sku,sales_count,slug",
        }),
      ]);
      const revenue = paidOrders.reduce((acc, o) => acc + (o.grand_total ?? 0), 0);
      const currency = paidOrders[0]?.currency ?? "USD";
      return {
        revenue,
        currency,
        ordersTotal: allOrders.totalItems,
        paidOrders: paidOrders.length,
        customers: customers.totalItems,
        lowStock: lowStock.items,
        bestSellers: bestSellers.items,
      };
    },
  });

  const recentOrders = useQuery({
    queryKey: ["admin", "recent-orders"],
    queryFn: () => pb().collection("orders").getList<Order>(1, 8, { sort: "-created" }),
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Overview</p>
        <h1 className="display-serif text-3xl lg:text-4xl mt-2">Dashboard</h1>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile icon={Banknote} label="Revenue (paid)"
          value={stats.isLoading ? "…" : formatPrice(stats.data?.revenue ?? 0, stats.data?.currency ?? "USD")} />
        <Tile icon={ShoppingBag} label="Orders" value={stats.data?.ordersTotal ?? 0} />
        <Tile icon={Users} label="Customers" value={stats.data?.customers ?? 0} />
        <Tile icon={TrendingUp} label="Paid orders" value={stats.data?.paidOrders ?? 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="surface-luxe p-6">
          <header className="flex items-center justify-between mb-4">
            <h2 className="display-serif text-xl flex items-center gap-2">
              <AlertTriangle className="size-4 text-roseGold" /> Low stock
            </h2>
            <Link href="/admin/products?filter=low" className="text-xs hover:text-roseGold">View →</Link>
          </header>
          {stats.data?.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing low — fully stocked.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.data?.lowStock.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <Link href={`/admin/products/${p.id}`} className="text-sm hover:text-roseGold">
                    {p.name}
                    <span className="text-xs text-muted-foreground ml-2">{p.sku}</span>
                  </Link>
                  <span className="text-xs text-destructive">{p.stock_quantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-luxe p-6">
          <header className="flex items-center justify-between mb-4">
            <h2 className="display-serif text-xl flex items-center gap-2">
              <TrendingUp className="size-4 text-roseGold" /> Best sellers
            </h2>
            <Link href="/admin/products" className="text-xs hover:text-roseGold">View all →</Link>
          </header>
          {(stats.data?.bestSellers.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.data?.bestSellers.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <Link href={`/admin/products/${p.id}`} className="text-sm hover:text-roseGold">
                    {p.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{p.sales_count} sold</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="surface-luxe p-6">
        <header className="flex items-center justify-between mb-4">
          <h2 className="display-serif text-xl flex items-center gap-2">
            <Package className="size-4 text-roseGold" /> Recent orders
          </h2>
          <Link href="/admin/orders" className="text-xs hover:text-roseGold">View all →</Link>
        </header>
        {recentOrders.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (recentOrders.data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="text-left">
                <th className="py-2">Number</th>
                <th>Status</th>
                <th>Total</th>
                <th>Placed</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.data?.items.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className="py-2.5 font-medium">{o.order_number}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td>{formatPrice(o.grand_total, o.currency)}</td>
                  <td className="text-xs text-muted-foreground">
                    {new Date(o.placed_at || o.created).toLocaleDateString()}
                  </td>
                  <td className="text-right">
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
    </div>
  );
}

function Tile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string }) {
  return (
    <div className="surface-luxe p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="display-serif text-3xl mt-1">{value}</p>
        </div>
        <Icon className="size-5 text-roseGold" />
      </div>
    </div>
  );
}

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

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_TONE[status] ?? "bg-muted"}`}>
      {status.replace("_", " ")}
    </span>
  );
}