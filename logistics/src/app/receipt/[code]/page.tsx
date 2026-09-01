import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { fetchReceipt, NotFoundError, type ReceiptResult } from "@/lib/api";
import {
  PACKAGE_LABEL,
  SERVICE_LABEL,
  formatDate,
  formatDateTime,
  formatMoney,
  statusLabel,
} from "@/lib/shipment-meta";
import { VeloxaMark } from "@/components/brand";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shipment receipt",
  robots: { index: false, follow: false },
};

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { code } = await params;
  const { token } = await searchParams;
  const clean = decodeURIComponent(code).toUpperCase();

  let data: ReceiptResult | null = null;
  let error = "";
  try {
    if (!token) throw new NotFoundError("This receipt link is missing its access token.");
    data = await fetchReceipt(clean, token);
  } catch (err) {
    error =
      err instanceof NotFoundError
        ? err.message
        : "Could not load this receipt. Please try again shortly.";
  }

  if (!data) {
    return (
      <div className="container-wide py-20 lg:py-28">
        <div className="panel p-10 max-w-xl mx-auto text-center">
          <span className="inline-grid place-items-center size-14 rounded-full bg-amber-400/15 text-amber-300">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="display text-2xl text-white mt-5">Receipt unavailable</h1>
          <p className="text-sm text-mist-300 mt-3">{error}</p>
          <Link href={`/track/${encodeURIComponent(clean)}`} className="btn-primary mt-8">
            Track {clean} instead <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide py-12 lg:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
        <Link
          href={`/track/${encodeURIComponent(data.tracking_code)}`}
          className="text-sm text-mist-400 hover:text-white"
        >
          ← Track this shipment
        </Link>
        <PrintButton />
      </div>

      <article className="panel p-8 lg:p-12 max-w-4xl mx-auto print:border-0 print:bg-white print:text-navy-950">
        {/* letterhead */}
        <header className="flex flex-wrap items-start justify-between gap-6 pb-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <VeloxaMark className="size-11" />
            <div>
              <p className="display text-xl text-white tracking-[0.18em] print:text-navy-950">VELOXA</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-mist-400 mt-1">
                Swift by nature
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="eyebrow">Shipment receipt</p>
            <p className="display text-2xl text-white font-mono tracking-wider mt-1 print:text-navy-950">
              {data.tracking_code}
            </p>
            <p className="text-xs text-mist-400 mt-1">Issued {formatDateTime(data.created)}</p>
            <p className="text-xs text-mist-400 mt-0.5">
              Status: <span className="text-white print:text-navy-950">{statusLabel(data.status)}</span>
            </p>
          </div>
        </header>

        {/* parties */}
        <div className="grid sm:grid-cols-2 gap-10 py-8 border-b border-white/10">
          <Party
            title="From"
            name={data.sender_name}
            company={data.sender_company}
            address={data.sender_address}
            city={data.sender_city}
            state={data.sender_state}
            postal={data.sender_postal_code}
            country={data.sender_country}
            phone={data.sender_phone}
            email={data.sender_email}
          />
          <Party
            title="To"
            name={data.receiver_name}
            company={data.receiver_company}
            address={data.receiver_address}
            city={data.receiver_city}
            state={data.receiver_state}
            postal={data.receiver_postal_code}
            country={data.receiver_country}
            phone={data.receiver_phone}
            email={data.receiver_email}
          />
        </div>

        {/* consignment */}
        <div className="py-8 border-b border-white/10">
          <p className="eyebrow mb-4">Consignment</p>
          <dl className="grid sm:grid-cols-4 gap-5">
            <Cell label="Service" value={SERVICE_LABEL[data.service_type] ?? data.service_type} />
            <Cell label="Package" value={PACKAGE_LABEL[data.package_type] ?? data.package_type} />
            <Cell label="Pieces" value={String(data.pieces || 1)} />
            <Cell label="Reference" value={data.reference || "—"} />
            <Cell label="Actual weight" value={`${data.weight_kg} kg`} />
            <Cell label="Volumetric" value={`${data.volumetric_kg || 0} kg`} />
            <Cell label="Chargeable" value={`${data.chargeable_kg || data.weight_kg} kg`} />
            <Cell
              label="Declared value"
              value={data.declared_value ? formatMoney(data.declared_value, data.currency) : "—"}
            />
            <Cell label="Pickup" value={formatDate(data.pickup_date)} />
            <Cell label="Est. delivery" value={formatDate(data.estimated_delivery)} />
            <Cell label="Shipped" value={formatDate(data.shipped_at)} />
            <Cell label="Delivered" value={formatDate(data.delivered_at)} />
          </dl>

          <p className="text-sm text-mist-200 mt-5 print:text-navy-900">
            <span className="text-mist-400">Contents: </span>
            {data.contents}
          </p>
          <p className="text-xs text-mist-400 mt-2">
            {[
              data.fragile && "Fragile handling",
              data.insured && "Insured",
              data.signature_required && "Signature required",
              data.is_international ? "International" : "Domestic",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* charges */}
        <div className="py-8 border-b border-white/10">
          <p className="eyebrow mb-4">Charges</p>
          <table className="w-full text-sm">
            <tbody>
              <ChargeRow label="Freight" value={formatMoney(data.shipping_cost, data.currency)} />
              {data.insurance_fee > 0 && (
                <ChargeRow label="Insurance" value={formatMoney(data.insurance_fee, data.currency)} />
              )}
              <ChargeRow label="Tax" value={formatMoney(data.tax_total, data.currency)} />
              <tr className="border-t border-white/10">
                <td className="pt-4 display text-lg text-white print:text-navy-950">Total</td>
                <td className="pt-4 text-right display text-lg text-white print:text-navy-950">
                  {formatMoney(data.total_cost, data.currency)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-mist-400 mt-3 capitalize">
            {String(data.payment_method || "").replace(/_/g, " ")} · {data.payment_status}
          </p>
        </div>

        {/* footer */}
        <footer className="pt-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs text-mist-400">Track this shipment</p>
            <p className="text-sm text-white break-all print:text-navy-950">
              veloxa.com/track/{data.tracking_code}
            </p>
          </div>
          <p className="text-[10px] text-mist-400 max-w-sm text-right leading-relaxed">
            Carriage is subject to the Veloxa Logistics terms of carriage. Declared value does not
            constitute insurance unless an insurance line is charged above.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Party(props: {
  title: string;
  name: string;
  company?: string;
  address: string;
  city: string;
  state?: string;
  postal?: string;
  country: string;
  phone: string;
  email?: string;
}) {
  return (
    <div>
      <p className="eyebrow">{props.title}</p>
      <p className="text-sm font-semibold text-white mt-3 print:text-navy-950">{props.name}</p>
      {props.company && <p className="text-sm text-mist-300">{props.company}</p>}
      <p className="text-sm text-mist-300 mt-2">{props.address}</p>
      <p className="text-sm text-mist-300">
        {[props.city, props.state, props.postal].filter(Boolean).join(", ")}
      </p>
      <p className="text-sm text-mist-300">{props.country}</p>
      <p className="text-sm text-mist-200 mt-2 print:text-navy-900">{props.phone}</p>
      {props.email && <p className="text-sm text-mist-300">{props.email}</p>}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-mist-400">{label}</dt>
      <dd className="text-sm text-white mt-1 print:text-navy-950">{value}</dd>
    </div>
  );
}

function ChargeRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 text-mist-400">{label}</td>
      <td className="py-1.5 text-right text-white print:text-navy-950">{value}</td>
    </tr>
  );
}
