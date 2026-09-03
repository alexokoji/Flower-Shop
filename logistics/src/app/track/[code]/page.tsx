import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  MapPin,
  PackageCheck,
  Plane,
  Truck,
  Warehouse,
} from "lucide-react";

import { fetchTracking, NotFoundError, type ShipmentStatus, type TrackingResult } from "@/lib/api";
import {
  DISRUPTED,
  JOURNEY,
  PACKAGE_LABEL,
  SERVICE_LABEL,
  STATUS_LABEL,
  formatDate,
  formatDateTime,
  statusLabel,
  statusTone,
} from "@/lib/shipment-meta";
import { TrackForm } from "@/components/track-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const clean = decodeURIComponent(code).toUpperCase();
  return {
    title: `Tracking ${clean}`,
    description: `Live status and location history for Veloxa shipment ${clean}.`,
    robots: { index: false, follow: false },
  };
}

const MILESTONE_ICON: Record<string, React.ElementType> = {
  pending_pickup: CalendarClock,
  picked_up: PackageCheck,
  in_transit: Plane,
  out_for_delivery: Truck,
  delivered: Check,
};

export default async function TrackCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = decodeURIComponent(code).toUpperCase();

  let data: TrackingResult | null = null;
  let error = "";
  try {
    data = await fetchTracking(clean);
  } catch (err) {
    error =
      err instanceof NotFoundError
        ? err.message
        : "Tracking is temporarily unavailable. Please try again in a moment.";
  }

  if (!data) {
    return (
      <div className="container-wide py-20 lg:py-28">
        <Link href="/track" className="text-sm text-mist-400 hover:text-white inline-flex items-center gap-2">
          <ArrowLeft className="size-4" /> Back to tracking
        </Link>
        <div className="panel p-10 mt-6 max-w-2xl text-center">
          <span className="inline-grid place-items-center size-14 rounded-full bg-amber-400/15 text-amber-300">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="display text-2xl text-white mt-5">Nothing found for {clean}</h1>
          <p className="text-sm text-mist-300 mt-3">{error}</p>
          <div className="mt-8 text-left">
            <TrackForm size="sm" initial={clean} />
          </div>
        </div>
      </div>
    );
  }

  const disrupted = DISRUPTED.includes(data.status);
  const currentIndex = JOURNEY.indexOf(data.status);
  const delivered = data.status === "delivered";

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop" aria-hidden="true" />

      <div className="container-wide relative py-12 lg:py-16">
        <Link
          href="/track"
          className="text-sm text-mist-400 hover:text-white inline-flex items-center gap-2"
        >
          <ArrowLeft className="size-4" /> Track another shipment
        </Link>

        {/* ------------------------------ summary ------------------------------ */}
        <section className="panel p-6 lg:p-8 mt-6 shadow-lift">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="eyebrow">Veloxa tracking number</p>
              <h1 className="display text-3xl lg:text-4xl text-white mt-2 font-mono tracking-wider">
                {data.tracking_code}
              </h1>
              <p className="text-sm text-mist-300 mt-3">
                {data.origin} <span className="text-mist-400">→</span> {data.destination}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-block rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${statusTone(
                  data.status
                )}`}
              >
                {statusLabel(data.status)}
              </span>
              <p className="text-sm text-mist-300 mt-3">
                {delivered ? "Delivered" : "Estimated delivery"}{" "}
                <span className="text-white">
                  {formatDate(delivered ? data.delivered_at : data.estimated_delivery)}
                </span>
              </p>
              {data.current_location && (
                <p className="text-xs text-mist-400 mt-1 flex items-center gap-1.5 justify-end">
                  <MapPin className="size-3.5" /> {data.current_location}
                </p>
              )}
            </div>
          </div>

          {/* progress rail */}
          {disrupted ? (
            <div className="mt-8 rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-4">
              <p className="text-sm text-amber-200">
                This shipment is <strong>{statusLabel(data.status)}</strong>. See the history below for
                what happened, or contact support with your tracking number.
              </p>
            </div>
          ) : (
            <ol className="mt-10 grid grid-cols-5 gap-2">
              {JOURNEY.map((milestone, i) => {
                const Icon = MILESTONE_ICON[milestone] ?? Warehouse;
                const reached = currentIndex >= i;
                const isCurrent = currentIndex === i;
                return (
                  <li key={milestone} className="text-center">
                    <div className="relative flex items-center justify-center">
                      {i > 0 && (
                        <span
                          className={`absolute right-1/2 h-0.5 w-full ${
                            currentIndex >= i ? "bg-signal-500" : "bg-white/10"
                          }`}
                        />
                      )}
                      <span
                        className={`relative z-10 grid place-items-center size-10 rounded-full border transition-colors ${
                          reached
                            ? "bg-signal-500 border-signal-500 text-white"
                            : "bg-navy-800 border-white/10 text-mist-400"
                        } ${isCurrent ? "ring-4 ring-signal-500/25" : ""}`}
                      >
                        <Icon className="size-4" />
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-3 leading-tight ${
                        reached ? "text-white" : "text-mist-400"
                      }`}
                    >
                      {STATUS_LABEL[milestone as ShipmentStatus]}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mt-6">
          {/* ------------------------------ history ------------------------------ */}
          <section className="panel p-6 lg:p-8">
            <h2 className="display text-xl text-white">Shipment history</h2>
            {!data.events.length ? (
              <p className="text-sm text-mist-300 mt-4">
                No scans recorded yet. Check back shortly.
              </p>
            ) : (
              <ol className="mt-6 relative border-l border-white/10 ml-3 space-y-7">
                {data.events.map((ev, i) => (
                  <li key={`${ev.occurred_at}-${i}`} className="pl-7 relative">
                    <span
                      className={`absolute -left-[7px] top-1.5 size-3.5 rounded-full border-2 border-navy-900 ${
                        i === 0 ? "bg-velocity-400 animate-pulse-dot" : "bg-mist-600"
                      }`}
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{statusLabel(ev.status)}</p>
                      <p className="text-xs text-mist-400 font-mono">{formatDateTime(ev.occurred_at)}</p>
                    </div>
                    {ev.location && (
                      <p className="text-xs text-signal-300 mt-1.5 flex items-center gap-1.5">
                        <MapPin className="size-3" /> {ev.location}
                      </p>
                    )}
                    {ev.description && (
                      <p className="text-sm text-mist-300 mt-1.5 leading-relaxed">{ev.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ------------------------------ details ------------------------------ */}
          <section className="panel p-6 lg:p-8 h-fit">
            <h2 className="display text-xl text-white">Shipment details</h2>
            <dl className="mt-6 divide-y divide-white/10">
              <Detail label="Service" value={SERVICE_LABEL[data.service_type] ?? data.service_type} />
              <Detail label="Package" value={PACKAGE_LABEL[data.package_type] ?? data.package_type} />
              <Detail label="Pieces" value={String(data.pieces || 1)} />
              <Detail label="Weight" value={`${data.weight_kg} kg`} />
              <Detail label="From" value={data.origin} />
              <Detail label="To" value={data.destination} />
              <Detail label="Sender" value={data.sender_name || "—"} />
              <Detail label="Receiver" value={data.receiver_name || "—"} />
              <Detail label="Booked" value={formatDate(data.created)} />
              <Detail
                label="Scope"
                value={data.is_international ? "International" : "Domestic"}
              />
            </dl>
            <p className="text-[11px] text-mist-400 mt-6 leading-relaxed">
              Names are partially masked and addresses withheld. The full consignment record is
              available to the account holder in the Veloxa partner portal.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-xs text-mist-400">{label}</dt>
      <dd className="text-sm text-white text-right">{value}</dd>
    </div>
  );
}
