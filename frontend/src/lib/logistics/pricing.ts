import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { HttpError } from "@/lib/api/guard";
import type { LogisticsSettingsDoc, ShipmentDoc } from "@/lib/db/types";

/**
 * Shipment pricing.
 *
 * Every shipment costs the same flat amount, set by an admin in
 * /admin/logistics and stored on the `logistics_settings` row. Weight, distance
 * and service tier do not change the price.
 *
 * Volumetric and chargeable weight are still computed, because the figures
 * appear on the booking form, the receipt and the tracking page — they are
 * shipping documentation now, not pricing inputs.
 *
 * Transit-day estimates remain per service tier: how fast it moves is a
 * different question from what it costs.
 */

/** Used when no fee has been configured yet. */
export const DEFAULT_FLAT_FEE = 25;

/** Transit estimates per tier. No longer carries any pricing. */
export const TRANSIT_DAYS: Record<string, number> = {
  same_day: 0,
  overnight: 1,
  express: 2,
  standard: 5,
  economy: 9,
  freight: 12,
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export interface PriceInput {
  service_type: string;
  pieces?: number;
  weight_kg: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  sender_country?: string;
  receiver_country?: string;
}

export interface PriceResult {
  volumetric_kg: number;
  chargeable_kg: number;
  is_international: boolean;
  shipping_cost: number;
  insurance_fee: number;
  tax_total: number;
  total_cost: number;
  transit_days: number;
  estimated_delivery: Date;
}

/**
 * Price a shipment at the configured flat fee.
 *
 * `flatFee` is passed in rather than read here so this stays a pure function —
 * the quote endpoint and the create hook both fetch it once and share it.
 */
export function priceShipment(input: PriceInput, flatFee: number): PriceResult {
  const pieces = Math.max(1, Math.floor(num(input.pieces, 1)));
  const actual = num(input.weight_kg);

  // Documentation only — the IATA divisor no longer affects the price.
  const volumetric = round2(
    (num(input.length_cm) * num(input.width_cm) * num(input.height_cm) * pieces) / 5000
  );
  const chargeable = round2(Math.max(actual, volumetric));

  const from = String(input.sender_country ?? "").trim().toLowerCase();
  const to = String(input.receiver_country ?? "").trim().toLowerCase();
  const international = !!from && !!to && from !== to;

  const days = (TRANSIT_DAYS[input.service_type] ?? TRANSIT_DAYS.standard) + (international ? 3 : 0);
  const fee = round2(num(flatFee, DEFAULT_FLAT_FEE));

  return {
    volumetric_kg: volumetric,
    chargeable_kg: chargeable,
    is_international: international,
    // The whole price is the flat fee: no surcharges, no tax line, so the
    // figure an admin sets is exactly what the customer pays.
    shipping_cost: fee,
    insurance_fee: 0,
    tax_total: 0,
    total_cost: fee,
    transit_days: days,
    estimated_delivery: new Date(Date.now() + days * 86_400_000),
  };
}

/** The admin-configured flat fee and the currency it is charged in. */
export async function getFlatFee(): Promise<{ fee: number; currency: string }> {
  const settings = await coll<LogisticsSettingsDoc>(C.logisticsSettings);
  const cfg = await settings.findOne({ key: "default" });
  const raw = cfg?.shipment_flat_fee;
  return {
    fee: typeof raw === "number" && raw >= 0 ? raw : DEFAULT_FLAT_FEE,
    currency: cfg?.payment_currency || "USD",
  };
}

/* -------------------------------------------------------------------------- */
/* Tracking codes                                                             */
/* -------------------------------------------------------------------------- */

// No I/O/0/1 — these are read aloud and typed by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function block(n: number): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Allocate a code that is not already taken. */
export async function allocateTrackingCode(): Promise<string> {
  const shipments = await coll<ShipmentDoc>(C.shipments);
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = `VLX-${block(4)}-${block(4)}`;
    if (!(await shipments.findOne({ tracking_code: candidate }))) return candidate;
  }
  throw new HttpError(500, "Could not allocate a tracking code. Please retry.");
}

export function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, bytes);
}
