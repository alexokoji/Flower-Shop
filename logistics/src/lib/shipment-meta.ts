import type { ShipmentStatus } from "@/lib/api";

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  draft: "Draft",
  pending_pickup: "Pending pickup",
  picked_up: "Picked up",
  in_transit: "In transit",
  at_facility: "At facility",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  on_hold: "On hold",
  exception: "Exception",
  returned: "Returned",
  cancelled: "Cancelled",
};

/** Milestones shown on the progress rail, in journey order. */
export const JOURNEY: ShipmentStatus[] = [
  "pending_pickup",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

/** Statuses that take the shipment off the happy path. */
export const DISRUPTED: ShipmentStatus[] = ["on_hold", "exception", "returned", "cancelled"];

export const SERVICE_LABEL: Record<string, string> = {
  same_day: "Same day",
  overnight: "Overnight",
  express: "Express",
  standard: "Standard",
  economy: "Economy",
  freight: "Freight",
};

export const PACKAGE_LABEL: Record<string, string> = {
  parcel: "Parcel",
  envelope: "Envelope",
  document: "Document",
  box: "Box",
  pallet: "Pallet",
  crate: "Crate",
};

export function statusLabel(status: string) {
  return STATUS_LABEL[status as ShipmentStatus] ?? status.replace(/_/g, " ");
}

export function statusTone(status: string) {
  if (status === "delivered") return "bg-emerald-400/15 text-emerald-300 border-emerald-400/30";
  if (DISRUPTED.includes(status as ShipmentStatus))
    return "bg-amber-400/15 text-amber-300 border-amber-400/30";
  return "bg-signal-500/15 text-signal-300 border-signal-500/30";
}

export function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Normalise whatever the visitor pastes into the tracking box. */
export function normaliseCode(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
