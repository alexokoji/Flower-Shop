/**
 * Veloxa talks to the same PocketBase instance that powers the Xperience
 * Delivery store — but only through the two public, sanitised endpoints:
 *
 *   GET /api/track/{code}      no addresses, masked names
 *   GET /api/receipt/{code}    full receipt, requires the shipment's token
 *
 * There is no write path and no login here: shipments are created in the store's
 * customer dashboard, and Veloxa is the public face that tracks them.
 */

// Trim and fall back on an empty value too — an env var set to "" in a hosting
// dashboard would otherwise produce requests to a relative, meaningless path.
export const PB_URL = ((process.env.NEXT_PUBLIC_PB_URL ?? "").trim() || "http://localhost:8090").replace(
  /\/+$/,
  ""
);

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

export interface TrackingEvent {
  status: ShipmentStatus;
  location: string;
  description: string;
  occurred_at: string;
}

export interface TrackingResult {
  tracking_code: string;
  status: ShipmentStatus;
  service_type: string;
  package_type: string;
  pieces: number;
  weight_kg: number;
  chargeable_kg: number;
  is_international: boolean;
  current_location: string;
  estimated_delivery: string;
  shipped_at: string;
  delivered_at: string;
  created: string;
  origin: string;
  destination: string;
  sender_name: string;
  receiver_name: string;
  events: TrackingEvent[];
}

export interface ReceiptResult {
  tracking_code: string;
  reference: string;
  status: ShipmentStatus;
  service_type: string;
  package_type: string;
  pieces: number;
  weight_kg: number;
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
  payment_method: string;
  payment_status: string;
  current_location: string;
  notes: string;
  pickup_date: string;
  estimated_delivery: string;
  shipped_at: string;
  delivered_at: string;
  created: string;

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
}

export class NotFoundError extends Error {}

/** Tracking is public, so this runs on the server and is never cached. */
export async function fetchTracking(code: string): Promise<TrackingResult> {
  const res = await fetch(`${PB_URL}/api/track/${encodeURIComponent(code.trim().toUpperCase())}`, {
    cache: "no-store",
  });
  if (res.status === 404) throw new NotFoundError("No shipment found for that tracking number.");
  if (!res.ok) throw new Error("Tracking is temporarily unavailable. Please try again.");
  return res.json();
}

export async function fetchReceipt(code: string, token: string): Promise<ReceiptResult> {
  const res = await fetch(
    `${PB_URL}/api/receipt/${encodeURIComponent(code.trim().toUpperCase())}?token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  if (res.status === 404 || res.status === 400) {
    throw new NotFoundError("This receipt link is invalid or has expired.");
  }
  if (!res.ok) throw new Error("Could not load this receipt. Please try again.");
  return res.json();
}

export interface QuoteResult {
  currency: string;
  volumetric_kg: number;
  chargeable_kg: number;
  is_international: boolean;
  shipping_cost: number;
  insurance_fee: number;
  tax_total: number;
  total_cost: number;
  transit_days: number;
  estimated_delivery: string;
}

/** Used by the homepage rate calculator. Quoting creates nothing. */
export async function fetchQuote(input: Record<string, unknown>): Promise<QuoteResult> {
  const res = await fetch(`${PB_URL}/api/logistics/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message ?? "Could not price that shipment.");
  }
  return res.json();
}
