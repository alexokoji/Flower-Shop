"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";

import { pb } from "@/lib/pb";
import { formatPrice } from "@/lib/utils";
import {
  PACKAGE_LABEL,
  SERVICE_LABEL,
  formatDate,
  formatDateTime,
  receiptUrl,
  statusLabel,
  trackingUrl,
  type Shipment,
} from "@/lib/shipments";

export default function ShipmentReceiptPage() {
  const { id } = useParams<{ id: string }>();

  const { data: s, isLoading } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => pb().collection("shipments").getOne<Shipment>(id),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading receipt…</p>;
  if (!s) return <p className="text-sm text-muted-foreground">Receipt not found.</p>;

  const share = async () => {
    const url = receiptUrl(s.tracking_code, s.public_token);
    const payload = {
      title: `Veloxa receipt ${s.tracking_code}`,
      text: `Shipment ${s.tracking_code} to ${s.receiver_name}.`,
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Receipt link copied to clipboard");
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/account/shipments/${s.id}`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" /> Back to shipment
        </Link>
        <div className="flex gap-2">
          <button onClick={share} className="btn-outline-gold !text-xs inline-flex items-center gap-1.5">
            <Share2 className="size-3.5" /> Share
          </button>
          <button
            onClick={() => window.print()}
            className="btn-gold !text-xs inline-flex items-center gap-1.5"
          >
            <Printer className="size-3.5" /> Print / save PDF
          </button>
        </div>
      </div>

      <article className="surface-luxe p-8 print:shadow-none print:border-0">
        {/* letterhead */}
        <header className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-border">
          <div>
            <p className="display-serif text-2xl tracking-[0.3em]">VELOXA</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">
              Swift by nature
            </p>
          </div>
          <div className="text-right">
            <p className="eyebrow">Shipment receipt</p>
            <p className="display-serif text-2xl tracking-wider mt-1">{s.tracking_code}</p>
            <p className="text-xs text-muted-foreground mt-1">Issued {formatDateTime(s.created)}</p>
          </div>
        </header>

        {/* parties */}
        <div className="grid sm:grid-cols-2 gap-8 py-6 border-b border-border">
          <div>
            <p className="eyebrow">From</p>
            <p className="text-sm font-medium mt-2">{s.sender_name}</p>
            {s.sender_company && <p className="text-sm text-muted-foreground">{s.sender_company}</p>}
            <p className="text-sm text-muted-foreground mt-1">{s.sender_address}</p>
            <p className="text-sm text-muted-foreground">
              {[s.sender_city, s.sender_state, s.sender_postal_code].filter(Boolean).join(", ")}
            </p>
            <p className="text-sm text-muted-foreground">{s.sender_country}</p>
            <p className="text-sm mt-2">{s.sender_phone}</p>
            {s.sender_email && <p className="text-sm text-muted-foreground">{s.sender_email}</p>}
          </div>
          <div>
            <p className="eyebrow">To</p>
            <p className="text-sm font-medium mt-2">{s.receiver_name}</p>
            {s.receiver_company && <p className="text-sm text-muted-foreground">{s.receiver_company}</p>}
            <p className="text-sm text-muted-foreground mt-1">{s.receiver_address}</p>
            <p className="text-sm text-muted-foreground">
              {[s.receiver_city, s.receiver_state, s.receiver_postal_code].filter(Boolean).join(", ")}
            </p>
            <p className="text-sm text-muted-foreground">{s.receiver_country}</p>
            <p className="text-sm mt-2">{s.receiver_phone}</p>
            {s.receiver_email && <p className="text-sm text-muted-foreground">{s.receiver_email}</p>}
          </div>
        </div>

        {/* consignment */}
        <div className="py-6 border-b border-border">
          <p className="eyebrow mb-3">Consignment</p>
          <dl className="grid sm:grid-cols-4 gap-4 text-sm">
            <Cell label="Service" value={SERVICE_LABEL[s.service_type] ?? s.service_type} />
            <Cell label="Package" value={PACKAGE_LABEL[s.package_type] ?? s.package_type} />
            <Cell label="Pieces" value={String(s.pieces || 1)} />
            <Cell label="Status" value={statusLabel(s.status)} />
            <Cell label="Actual weight" value={`${s.weight_kg} kg`} />
            <Cell label="Volumetric" value={`${s.volumetric_kg || 0} kg`} />
            <Cell label="Chargeable" value={`${s.chargeable_kg || s.weight_kg} kg`} />
            <Cell
              label="Dimensions"
              value={s.length_cm ? `${s.length_cm}×${s.width_cm}×${s.height_cm} cm` : "—"}
            />
            <Cell label="Reference" value={s.reference || "—"} />
            <Cell label="Pickup" value={formatDate(s.pickup_date)} />
            <Cell label="Est. delivery" value={formatDate(s.estimated_delivery)} />
            <Cell
              label="Declared value"
              value={s.declared_value ? formatPrice(s.declared_value, s.currency) : "—"}
            />
          </dl>
          <p className="text-sm mt-4">
            <span className="text-muted-foreground">Contents: </span>
            {s.contents}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {[
              s.fragile && "Fragile handling",
              s.insured && "Insured",
              s.signature_required && "Signature required",
              s.is_international ? "International" : "Domestic",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* charges */}
        <div className="py-6 border-b border-border">
          <p className="eyebrow mb-3">Charges</p>
          <table className="w-full text-sm">
            <tbody>
              <ChargeRow label="Freight" value={formatPrice(s.shipping_cost, s.currency)} />
              {s.insurance_fee > 0 && (
                <ChargeRow label="Insurance" value={formatPrice(s.insurance_fee, s.currency)} />
              )}
              <ChargeRow label="Tax" value={formatPrice(s.tax_total, s.currency)} />
              <tr className="border-t border-border">
                <td className="py-3 display-serif text-lg">Total</td>
                <td className="py-3 text-right display-serif text-lg">
                  {formatPrice(s.total_cost, s.currency)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground capitalize">
            {s.payment_method?.replace(/_/g, " ")} · {s.payment_status}
          </p>
        </div>

        {/* footer */}
        <footer className="pt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Track this shipment</p>
            <p className="text-sm break-all">{trackingUrl(s.tracking_code)}</p>
          </div>
          <p className="text-[10px] text-muted-foreground max-w-xs text-right leading-snug">
            Carriage is subject to the Veloxa Logistics terms of carriage. Declared value does not constitute
            insurance unless the insurance line above is charged.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function ChargeRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 text-muted-foreground">{label}</td>
      <td className="py-1.5 text-right">{value}</td>
    </tr>
  );
}
