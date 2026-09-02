"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  MapPin,
  Receipt,
  Share2,
} from "lucide-react";

import { pb } from "@/lib/pb";
import { extractError } from "@/lib/errors";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  JOURNEY,
  PACKAGE_LABEL,
  SERVICE_LABEL,
  STATUS_HINT,
  STATUS_LABEL,
  UPDATABLE_STATUSES,
  formatDate,
  formatDateTime,
  receiptUrl,
  statusLabel,
  statusTone,
  trackingUrl,
  type Shipment,
  type ShipmentEvent,
  type ShipmentStatus,
} from "@/lib/shipments";

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const qc = useQueryClient();

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => pb().collection("shipments").getOne<Shipment>(id),
  });

  const { data: events } = useQuery({
    queryKey: ["shipment-events", id],
    queryFn: () =>
      pb().collection("shipment_events").getFullList<ShipmentEvent>({
        filter: `shipment = "${id}"`,
        sort: "-occurred_at",
      }),
  });

  useEffect(() => {
    if (search.get("created") === "1") {
      toast.success("Shipment booked. Share the tracking code with your receiver.");
    }
  }, [search]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading shipment…</p>;
  if (!shipment) {
    return (
      <div className="surface-luxe p-12 text-center">
        <p className="display-serif text-2xl">Shipment not found</p>
        <Link href="/account/shipments" className="btn-outline-gold !text-xs inline-flex mt-5">
          Back to shipments
        </Link>
      </div>
    );
  }

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["shipment", id] });
    qc.invalidateQueries({ queryKey: ["shipment-events", id] });
    qc.invalidateQueries({ queryKey: ["shipments"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/shipments"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" /> All shipments
        </Link>
      </div>

      {/* ---------------- header ---------------- */}
      <section className="surface-luxe p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Veloxa tracking number</p>
            <h2 className="display-serif text-3xl mt-1 tracking-wider">{shipment.tracking_code}</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {shipment.sender_city}, {shipment.sender_country} → {shipment.receiver_city},{" "}
              {shipment.receiver_country}
            </p>
          </div>
          <div className="text-right space-y-2">
            <span
              className={`inline-block text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full ${statusTone(
                shipment.status
              )}`}
            >
              {statusLabel(shipment.status)}
            </span>
            <p className="text-xs text-muted-foreground">
              Est. delivery {formatDate(shipment.estimated_delivery)}
            </p>
          </div>
        </div>

        {shipment.payment_status !== "paid" && (
          <div className="mt-5 rounded-xl bg-amber-100 text-amber-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <strong>Payment outstanding.</strong> Tracking stays private until this shipment is paid for.
            </p>
            <Link href={`/account/shipments/${shipment.id}/pay`} className="btn-gold !text-xs">
              Complete payment
            </Link>
          </div>
        )}

        <JourneyRail status={shipment.status} />

        <div className="flex flex-wrap gap-2 mt-6">
          <CopyButton label="Copy tracking code" value={shipment.tracking_code} />
          <CopyButton label="Copy tracking link" value={trackingUrl(shipment.tracking_code)} />
          <a
            href={trackingUrl(shipment.tracking_code)}
            target="_blank"
            rel="noreferrer"
            className="btn-outline-gold !text-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink className="size-3.5" /> Open on Veloxa
          </a>
          <Link
            href={`/account/shipments/${shipment.id}/receipt`}
            className="btn-outline-gold !text-xs inline-flex items-center gap-1.5"
          >
            <Receipt className="size-3.5" /> Receipt
          </Link>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {/* ---------------- timeline ---------------- */}
          <section className="surface-luxe p-6">
            <h3 className="display-serif text-xl mb-5">Tracking history</h3>
            {!events?.length ? (
              <p className="text-sm text-muted-foreground">No tracking events yet.</p>
            ) : (
              <ol className="relative border-l border-border ml-2 space-y-6">
                {events.map((ev, i) => (
                  <li key={ev.id} className="pl-6 relative">
                    <span
                      className={`absolute -left-[7px] top-1 size-3.5 rounded-full border-2 border-background ${
                        i === 0 ? "bg-roseGold" : "bg-muted-foreground/40"
                      }`}
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{statusLabel(ev.status)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(ev.occurred_at)}</p>
                    </div>
                    {ev.location && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <MapPin className="size-3" /> {ev.location}
                      </p>
                    )}
                    {ev.description && <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ---------------- parties + package ---------------- */}
          <div className="grid sm:grid-cols-2 gap-6">
            <PartyCard
              title="Sender"
              name={shipment.sender_name}
              company={shipment.sender_company}
              phone={shipment.sender_phone}
              email={shipment.sender_email}
              address={shipment.sender_address}
              city={shipment.sender_city}
              state={shipment.sender_state}
              postal={shipment.sender_postal_code}
              country={shipment.sender_country}
            />
            <PartyCard
              title="Receiver"
              name={shipment.receiver_name}
              company={shipment.receiver_company}
              phone={shipment.receiver_phone}
              email={shipment.receiver_email}
              address={shipment.receiver_address}
              city={shipment.receiver_city}
              state={shipment.receiver_state}
              postal={shipment.receiver_postal_code}
              country={shipment.receiver_country}
            />
          </div>

          <section className="surface-luxe p-6">
            <h3 className="display-serif text-xl mb-4">Package</h3>
            <dl className="grid sm:grid-cols-3 gap-4 text-sm">
              <Detail label="Service" value={SERVICE_LABEL[shipment.service_type] ?? shipment.service_type} />
              <Detail label="Package type" value={PACKAGE_LABEL[shipment.package_type] ?? shipment.package_type} />
              <Detail label="Pieces" value={String(shipment.pieces || 1)} />
              <Detail label="Actual weight" value={`${shipment.weight_kg} kg`} />
              <Detail label="Volumetric" value={`${shipment.volumetric_kg || 0} kg`} />
              <Detail label="Chargeable" value={`${shipment.chargeable_kg || shipment.weight_kg} kg`} />
              <Detail
                label="Dimensions"
                value={
                  shipment.length_cm
                    ? `${shipment.length_cm} × ${shipment.width_cm} × ${shipment.height_cm} cm`
                    : "—"
                }
              />
              <Detail
                label="Declared value"
                value={
                  shipment.declared_value
                    ? formatPrice(shipment.declared_value, shipment.currency)
                    : "—"
                }
              />
              <Detail label="Reference" value={shipment.reference || "—"} />
            </dl>
            <p className="text-sm mt-4">
              <span className="text-muted-foreground">Contents: </span>
              {shipment.contents}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {shipment.fragile && <Tag>Fragile</Tag>}
              {shipment.insured && <Tag>Insured</Tag>}
              {shipment.signature_required && <Tag>Signature required</Tag>}
              {shipment.is_international && <Tag>International</Tag>}
            </div>
            {shipment.notes && (
              <p className="text-sm mt-4">
                <span className="text-muted-foreground">Instructions: </span>
                {shipment.notes}
              </p>
            )}
          </section>
        </div>

        {/* ---------------- update + charges rail ---------------- */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          {shipment.payment_status === "paid" ? (
            <UpdateStatusCard shipment={shipment} onDone={refresh} />
          ) : (
            <section className="surface-luxe p-5">
              <p className="eyebrow">Update tracking</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tracking updates unlock once payment is confirmed.
              </p>
              <Link
                href={`/account/shipments/${shipment.id}/pay`}
                className="btn-gold !text-xs inline-flex mt-4"
              >
                Complete payment
              </Link>
            </section>
          )}

          <section className="surface-luxe p-5">
            <p className="eyebrow">Charges</p>
            <dl className="space-y-2 text-sm mt-3">
              <Row label="Shipping" value={formatPrice(shipment.shipping_cost, shipment.currency)} />
              {shipment.insurance_fee > 0 && (
                <Row label="Insurance" value={formatPrice(shipment.insurance_fee, shipment.currency)} />
              )}
              {shipment.tax_total > 0 && (
                <Row label="Tax" value={formatPrice(shipment.tax_total, shipment.currency)} />
              )}
            </dl>
            <div className="border-t border-border mt-3 pt-3 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="display-serif text-2xl">
                {formatPrice(shipment.total_cost, shipment.currency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 capitalize">
              {shipment.payment_method?.replace(/_/g, " ")} · {shipment.payment_status}
            </p>
          </section>

          <section className="surface-luxe p-5">
            <p className="eyebrow">Share</p>
            <p className="text-xs text-muted-foreground mt-2 mb-3">
              The receipt link works without a Veloxa account — safe to send to your receiver.
            </p>
            <CopyButton
              label="Copy receipt link"
              value={receiptUrl(shipment.tracking_code, shipment.public_token)}
              icon={Share2}
              full
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function UpdateStatusCard({ shipment, onDone }: { shipment: Shipment; onDone: () => void }) {
  const [status, setStatus] = useState<ShipmentStatus>(shipment.status);
  const [location, setLocation] = useState(shipment.current_location ?? "");
  const [description, setDescription] = useState(STATUS_HINT[shipment.status] ?? "");
  const [occurredAt, setOccurredAt] = useState(() => toLocalInput(new Date()));

  const mutation = useMutation({
    mutationFn: async () => {
      await pb().collection("shipment_events").create({
        shipment: shipment.id,
        status,
        location,
        description,
        occurred_at: new Date(occurredAt).toISOString(),
      });
    },
    onSuccess: () => {
      toast.success(`Status updated to “${STATUS_LABEL[status]}”.`);
      onDone();
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  return (
    <section className="surface-luxe p-5 space-y-4">
      <div>
        <p className="eyebrow">Update tracking</p>
        <p className="text-xs text-muted-foreground mt-1">
          Each update is added to the public timeline immediately.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <select
          value={status}
          onChange={(e) => {
            const next = e.target.value as ShipmentStatus;
            setStatus(next);
            setDescription(STATUS_HINT[next] ?? "");
          }}
          className="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {UPDATABLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Location</Label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Lagos sorting hub, Nigeria"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Note</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Happened at</Label>
        <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
      </div>

      <Button
        type="button"
        className="w-full btn-gold"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Post update"}
      </Button>
    </section>
  );
}

function JourneyRail({ status }: { status: string }) {
  const idx = JOURNEY.indexOf(status as ShipmentStatus);
  const failed = ["cancelled", "returned", "exception", "on_hold"].includes(status);

  if (failed) {
    return (
      <p className="mt-6 text-sm rounded-xl bg-destructive/10 text-destructive px-4 py-3">
        This shipment is currently <strong>{statusLabel(status)}</strong>. Post an update to move it back into
        the network.
      </p>
    );
  }

  return (
    <ol className="mt-8 grid grid-cols-5 gap-1">
      {JOURNEY.map((s, i) => {
        const done = idx >= i;
        return (
          <li key={s} className="text-center">
            <div className="relative flex items-center justify-center">
              {i > 0 && (
                <span
                  className={`absolute right-1/2 w-full h-0.5 ${idx >= i ? "bg-roseGold" : "bg-border"}`}
                />
              )}
              <span
                className={`relative z-10 size-6 rounded-full grid place-items-center text-[10px] ${
                  done ? "bg-roseGold text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
            </div>
            <p
              className={`text-[10px] mt-2 leading-tight ${
                done ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {STATUS_LABEL[s]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function CopyButton({
  label,
  value,
  icon: Icon = Copy,
  full,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  full?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Could not copy — select the text manually.");
        }
      }}
      className={`btn-outline-gold !text-xs inline-flex items-center gap-1.5 ${full ? "w-full" : ""}`}
    >
      {copied ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function PartyCard(props: {
  title: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  postal?: string;
  country: string;
}) {
  return (
    <section className="surface-luxe p-6">
      <h3 className="display-serif text-xl mb-3">{props.title}</h3>
      <p className="text-sm font-medium">{props.name}</p>
      {props.company && <p className="text-sm text-muted-foreground">{props.company}</p>}
      <p className="text-sm text-muted-foreground mt-2">{props.address}</p>
      <p className="text-sm text-muted-foreground">
        {[props.city, props.state, props.postal].filter(Boolean).join(", ")}
      </p>
      <p className="text-sm text-muted-foreground">{props.country}</p>
      <p className="text-sm mt-3">{props.phone}</p>
      {props.email && <p className="text-sm text-muted-foreground">{props.email}</p>}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
      {children}
    </span>
  );
}

/** `datetime-local` needs a local (not UTC) string. */
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}
