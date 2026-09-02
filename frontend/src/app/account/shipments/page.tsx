"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Truck } from "lucide-react";

import { useAuth } from "@/stores/auth";
import { pb } from "@/lib/pb";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  SERVICE_LABEL,
  formatDate,
  statusLabel,
  statusTone,
  type Shipment,
} from "@/lib/shipments";

export default function ShipmentsPage() {
  const userId = useAuth((s) => s.user?.id);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["shipments", userId],
    enabled: !!userId,
    queryFn: () =>
      pb().collection("shipments").getFullList<Shipment>({
        filter: `user = "${userId}"`,
        sort: "-created",
      }),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((s) =>
      [s.tracking_code, s.reference, s.receiver_name, s.receiver_city, s.receiver_country, s.contents]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }, [data, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display text-xl">Shipments</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Book a consignment, get a tracking code, and keep its status current.
          </p>
        </div>
        <Link href="/account/shipments/new" className="btn-gold !text-xs inline-flex items-center gap-2">
          <Plus className="size-3.5" /> New shipment
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading shipments…</p>
      ) : !data?.length ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft p-12 text-center">
          <Truck className="size-8 mx-auto text-accent" />
          <p className="display text-xl mt-4">No shipments yet</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Create your first shipment to get a Veloxa tracking code, a shareable receipt, and a live timeline
            you control.
          </p>
          <Link href="/account/shipments/new" className="btn-gold !text-xs inline-flex mt-5">
            Create a shipment
          </Link>
        </div>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search code, receiver, city…"
              className="pl-10"
            />
          </div>

          <ul className="space-y-4">
            {filtered.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/account/shipments/${s.id}`}
                  className="rounded-2xl border border-border bg-card shadow-soft p-5 block hover:border-accent/50 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Tracking</p>
                      <p className="font-medium tracking-wider">{s.tracking_code}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {s.receiver_name} · {s.receiver_city}, {s.receiver_country}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Service</p>
                      <p className="text-sm">{SERVICE_LABEL[s.service_type] ?? s.service_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Est. delivery</p>
                      <p className="text-sm">{formatDate(s.estimated_delivery)}</p>
                    </div>
                    <div className="flex flex-col items-start gap-1.5">
                      <span
                        className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${statusTone(s.status)}`}
                      >
                        {statusLabel(s.status)}
                      </span>
                      {s.payment_status !== "paid" && (
                        <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-warning/15 text-warning">
                          Payment due
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-medium">{formatPrice(s.total_cost, s.currency)}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {q && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No shipments match “{q}”.</p>
          )}
        </>
      )}
    </div>
  );
}
