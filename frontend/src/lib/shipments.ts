import type { PbRecord } from "@/types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ShipmentStatus =
  | "draft"
  | "pending_pickup"
  | "picked_up"
  | "in_transit"
  | "at_facility"
  | "out_for_delivery"
  | "delivered"
  | "on_hold"
  | "exception"
  | "returned"
  | "cancelled";

export type ServiceType =
  | "same_day"
  | "overnight"
  | "express"
  | "standard"
  | "economy"
  | "freight";

export type PackageType = "parcel" | "envelope" | "document" | "box" | "pallet" | "crate";

export interface Shipment extends PbRecord {
  tracking_code: string;
  user: string;
  reference: string;
  service_type: ServiceType;
  package_type: PackageType;

  sender_name: string;
  sender_company: string;
  sender_phone: string;
  sender_email: string;
  sender_address: string;
  sender_city: string;
  sender_state: string;
  sender_postal_code: string;
  sender_country: string;

  receiver_name: string;
  receiver_company: string;
  receiver_phone: string;
  receiver_email: string;
  receiver_address: string;
  receiver_city: string;
  receiver_state: string;
  receiver_postal_code: string;
  receiver_country: string;

  pieces: number;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  volumetric_kg: number;
  chargeable_kg: number;
  contents: string;
  declared_value: number;

  fragile: boolean;
  insured: boolean;
  signature_required: boolean;
  is_international: boolean;

  currency: string;
  shipping_cost: number;
  insurance_fee: number;
  tax_total: number;
  total_cost: number;
  payment_method: "prepaid" | "collect_on_delivery" | "invoice";
  payment_status: "unpaid" | "paid" | "refunded";

  status: ShipmentStatus;
  current_location: string;
  notes: string;

  pickup_date: string;
  estimated_delivery: string;
  shipped_at: string;
  delivered_at: string;
  public_token: string;
}

export interface ShipmentEvent extends PbRecord {
  shipment: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  occurred_at: string;
  created_by: string;
}

/* -------------------------------------------------------------------------- */
/* Labels & presentation                                                      */
/* -------------------------------------------------------------------------- */

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

/** Default note pre-filled when a customer picks a status in the update form. */
export const STATUS_HINT: Record<ShipmentStatus, string> = {
  draft: "Shipment saved as a draft.",
  pending_pickup: "Shipment booked. Awaiting pickup by Veloxa.",
  picked_up: "Package collected from the sender.",
  in_transit: "Package is moving through the Veloxa network.",
  at_facility: "Package arrived at a sorting facility.",
  out_for_delivery: "Package is on the vehicle for final delivery.",
  delivered: "Package delivered and signed for.",
  on_hold: "Shipment temporarily held.",
  exception: "A delivery exception occurred.",
  returned: "Package is being returned to the sender.",
  cancelled: "Shipment cancelled.",
};

export const STATUS_TONE: Record<ShipmentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_pickup: "bg-muted text-foreground",
  picked_up: "bg-roseGold/15 text-roseGold-600",
  in_transit: "bg-gold/15 text-gold-500",
  at_facility: "bg-gold/15 text-gold-500",
  out_for_delivery: "bg-gold/20 text-gold-500",
  delivered: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-amber-100 text-amber-700",
  exception: "bg-destructive/10 text-destructive",
  returned: "bg-destructive/10 text-destructive",
  cancelled: "bg-destructive/10 text-destructive",
};

/** The statuses a customer may move a live shipment to, in journey order. */
export const UPDATABLE_STATUSES: ShipmentStatus[] = [
  "pending_pickup",
  "picked_up",
  "in_transit",
  "at_facility",
  "out_for_delivery",
  "delivered",
  "on_hold",
  "exception",
  "returned",
  "cancelled",
];

/** Milestones shown as the progress rail on tracking + detail views. */
export const JOURNEY: ShipmentStatus[] = [
  "pending_pickup",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export const SERVICE_LABEL: Record<ServiceType, string> = {
  same_day: "Same day",
  overnight: "Overnight",
  express: "Express",
  standard: "Standard",
  economy: "Economy",
  freight: "Freight",
};

export const SERVICE_BLURB: Record<ServiceType, string> = {
  same_day: "Collected and delivered today, within the same city.",
  overnight: "Next business day by end of day.",
  express: "2 business days, priority handling.",
  standard: "5 business days. The everyday choice.",
  economy: "9 business days. Best price for non-urgent freight.",
  freight: "Palletised and heavy cargo, 12 business days.",
};

export const PACKAGE_LABEL: Record<PackageType, string> = {
  parcel: "Parcel",
  envelope: "Envelope",
  document: "Document",
  box: "Box",
  pallet: "Pallet",
  crate: "Crate",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function statusLabel(status: string) {
  return STATUS_LABEL[status as ShipmentStatus] ?? status.replace(/_/g, " ");
}

export function statusTone(status: string) {
  return STATUS_TONE[status as ShipmentStatus] ?? "bg-muted text-foreground";
}

/** 0–1 progress along the JOURNEY rail. Terminal failures report full length. */
export function journeyProgress(status: string) {
  const i = JOURNEY.indexOf(status as ShipmentStatus);
  if (i >= 0) return i / (JOURNEY.length - 1);
  if (status === "delivered") return 1;
  if (status === "cancelled" || status === "returned") return 1;
  return 0;
}

export function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value.replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value.replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Volumetric weight (IATA divisor 5000) — mirrors the server-side rule. */
export function volumetricKg(l: number, w: number, h: number, pieces = 1) {
  const v = (l * w * h * pieces) / 5000;
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Public base URL of the Veloxa tracking site. */
export function logisticsBaseUrl() {
  return (process.env.NEXT_PUBLIC_LOGISTICS_URL ?? "http://localhost:3001").replace(/\/+$/, "");
}

export function trackingUrl(code: string) {
  return `${logisticsBaseUrl()}/track/${encodeURIComponent(code)}`;
}

export function receiptUrl(code: string, token: string) {
  return `${logisticsBaseUrl()}/receipt/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`;
}
