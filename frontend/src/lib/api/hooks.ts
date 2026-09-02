import type { Document } from "mongodb";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toObjectId, touch } from "@/lib/db/serialize";
import { HttpError } from "@/lib/api/guard";
import type { SessionClaims } from "@/lib/auth/session";
import { priceShipment, allocateTrackingCode, randomToken } from "@/lib/logistics/pricing";
import type { ShipmentDoc, ShipmentEventDoc } from "@/lib/db/types";

/**
 * Record hooks — the port of pocketbase/pb_hooks/*.pb.js.
 *
 * PocketBase ran these inside the database layer, so business rules applied no
 * matter which client wrote the row. The generic collections endpoint calls
 * them for the same reason: a shipment's price and tracking code must be set
 * server-side whether the write came from the booking form or anywhere else.
 */

type Body = Record<string, unknown>;

interface Hooks {
  beforeCreate?: (doc: Body, s: SessionClaims | null) => Promise<Body>;
  afterCreate?: (id: string, doc: Body, s: SessionClaims | null) => Promise<void>;
  afterUpdate?: (id: string, patch: Body, s: SessionClaims | null) => Promise<void>;
}

/**
 * Bring a paid shipment to life: mark it paid, move it out of draft, and write
 * the opening timeline event.
 *
 * This is the ONLY place a shipment becomes publicly trackable, so the webhook
 * and a manual admin confirmation cannot drift apart. It is idempotent —
 * re-confirming a payment does not duplicate the opening event.
 */
export async function activateShipment(shipmentId: string): Promise<void> {
  const _id = toObjectId(shipmentId);
  if (!_id) return;

  const shipments = await coll<ShipmentDoc>(C.shipments);
  const shipment = await shipments.findOne({ _id });
  if (!shipment || shipment.payment_status === "paid") return;

  const location =
    shipment.current_location ||
    [shipment.sender_city, shipment.sender_country].filter(Boolean).join(", ");

  const status = shipment.status === "draft" ? "pending_pickup" : shipment.status;

  await shipments.updateOne(
    { _id },
    { $set: { payment_status: "paid", status, current_location: location, ...touch() } }
  );

  const events = await coll<ShipmentEventDoc>(C.shipmentEvents);
  if (await events.findOne({ shipment: shipmentId })) return;

  await events.insertOne({
    shipment: shipmentId,
    status,
    location,
    description: "Payment received. Shipment booked and awaiting pickup by Veloxa.",
    occurred_at: new Date(),
    created_by: shipment.user,
    created: new Date(),
    updated: new Date(),
  } as ShipmentEventDoc);
}

export const HOOKS: Record<string, Hooks> = {
  /* ------------------------------------------------------------ shipments */
  [C.shipments]: {
    async beforeCreate(doc, s) {
      if (!s) throw new HttpError(401, "You must be signed in to create a shipment.");

      const priced = priceShipment({
        service_type: String(doc.service_type ?? "standard"),
        pieces: Number(doc.pieces ?? 1),
        weight_kg: Number(doc.weight_kg ?? 0),
        length_cm: Number(doc.length_cm ?? 0),
        width_cm: Number(doc.width_cm ?? 0),
        height_cm: Number(doc.height_cm ?? 0),
        declared_value: Number(doc.declared_value ?? 0),
        insured: !!doc.insured,
        fragile: !!doc.fragile,
        signature_required: !!doc.signature_required,
        sender_country: String(doc.sender_country ?? ""),
        receiver_country: String(doc.receiver_country ?? ""),
      });

      if (priced.chargeable_kg <= 0) throw new HttpError(400, "Package weight is required.");

      const senderCity = String(doc.sender_city ?? "");
      const senderCountry = String(doc.sender_country ?? "");

      return {
        ...doc,
        user: s.uid,
        tracking_code: await allocateTrackingCode(),
        public_token: randomToken(32),

        pieces: Math.max(1, Number(doc.pieces ?? 1)),
        volumetric_kg: priced.volumetric_kg,
        chargeable_kg: priced.chargeable_kg,
        is_international: priced.is_international,

        shipping_cost: priced.shipping_cost,
        insurance_fee: priced.insurance_fee,
        tax_total: priced.tax_total,
        total_cost: priced.total_cost,

        currency: String(doc.currency ?? "USD"),
        payment_method: String(doc.payment_method ?? "prepaid"),
        // A shipment is private until it is paid for.
        payment_status: "unpaid",
        status: "draft",

        current_location: [senderCity, senderCountry].filter(Boolean).join(", "),
        estimated_delivery: priced.estimated_delivery,
        pickup_date: doc.pickup_date ? new Date(String(doc.pickup_date)) : undefined,
      };
    },
  },

  /* ------------------------------------------------------- shipment_events */
  [C.shipmentEvents]: {
    async beforeCreate(doc, s) {
      return {
        ...doc,
        created_by: s?.uid,
        occurred_at: doc.occurred_at ? new Date(String(doc.occurred_at)) : new Date(),
      };
    },

    /** Mirror the newest event onto the parent so tracking reads one row. */
    async afterCreate(_id, doc) {
      const shipmentId = toObjectId(String(doc.shipment ?? ""));
      if (!shipmentId) return;

      const shipments = await coll<ShipmentDoc>(C.shipments);
      const status = String(doc.status ?? "");
      const occurred = doc.occurred_at instanceof Date ? doc.occurred_at : new Date();

      const set: Document = { status, ...touch() };
      if (doc.location) set.current_location = String(doc.location);
      if (status === "delivered") set.delivered_at = occurred;

      const unset: Document = {};
      if (status !== "delivered") unset.delivered_at = "";

      const parent = await shipments.findOne({ _id: shipmentId });
      if (parent && status === "picked_up" && !parent.shipped_at) set.shipped_at = occurred;

      await shipments.updateOne(
        { _id: shipmentId },
        Object.keys(unset).length ? { $set: set, $unset: unset } : { $set: set }
      );
    },
  },
};

/* ----------------------------------------------------- shipment_payments */
HOOKS[C.shipmentPayments] = {
  async afterUpdate(id, patch) {
    if (patch.status !== "paid") return;

    const payments = await coll<import("@/lib/db/types").ShipmentPaymentDoc>(C.shipmentPayments);
    const _id = toObjectId(id);
    if (!_id) return;

    const payment = await payments.findOne({ _id });
    if (!payment || payment.status !== "paid") return;

    if (!payment.paid_at) {
      await payments.updateOne({ _id }, { $set: { paid_at: new Date() } });
    }
    await activateShipment(payment.shipment);
  },
};

export function hooksFor(name: string): Hooks {
  return HOOKS[name] ?? {};
}

export type { ShipmentEventDoc };
