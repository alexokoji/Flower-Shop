import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { HttpError } from "@/lib/api/guard";
import type { ShipmentDoc } from "@/lib/db/types";

/**
 * Shipment pricing — the single source of truth, ported from
 * pocketbase/pb_hooks/shipments.pb.js.
 *
 * Both the quote endpoint and shipment creation call this, so the price a
 * customer is shown is by construction the price they are charged.
 */

export const RATES: Record<string, { base: number; perKg: number; days: number }> = {
  same_day: { base: 25, perKg: 4.5, days: 0 },
  overnight: { base: 20, perKg: 3.8, days: 1 },
  express: { base: 15, perKg: 3.0, days: 2 },
  standard: { base: 9, perKg: 1.8, days: 5 },
  economy: { base: 6, perKg: 1.2, days: 9 },
  freight: { base: 40, perKg: 0.9, days: 12 },
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
  declared_value?: number;
  insured?: boolean;
  fragile?: boolean;
  signature_required?: boolean;
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

export function priceShipment(input: PriceInput): PriceResult {
  const pieces = Math.max(1, Math.floor(num(input.pieces, 1)));
  const actual = num(input.weight_kg);

  // IATA volumetric divisor — billing uses the greater of the two weights.
  const volumetric = round2(
    (num(input.length_cm) * num(input.width_cm) * num(input.height_cm) * pieces) / 5000
  );
  const chargeable = round2(Math.max(actual, volumetric));

  const svc = RATES[input.service_type] ?? RATES.standard;
  const from = String(input.sender_country ?? "").trim().toLowerCase();
  const to = String(input.receiver_country ?? "").trim().toLowerCase();
  const international = !!from && !!to && from !== to;

  let shipping = svc.base + svc.perKg * chargeable;
  if (international) shipping *= 1.75;
  if (input.fragile) shipping += 4;
  if (input.signature_required) shipping += 2.5;
  shipping = round2(shipping);

  const insurance = input.insured ? round2(Math.max(3, num(input.declared_value) * 0.015)) : 0;
  const tax = round2((shipping + insurance) * 0.075);
  const days = svc.days + (international ? 3 : 0);

  return {
    volumetric_kg: volumetric,
    chargeable_kg: chargeable,
    is_international: international,
    shipping_cost: shipping,
    insurance_fee: insurance,
    tax_total: tax,
    total_cost: round2(shipping + insurance + tax),
    transit_days: days,
    estimated_delivery: new Date(Date.now() + days * 86_400_000),
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
