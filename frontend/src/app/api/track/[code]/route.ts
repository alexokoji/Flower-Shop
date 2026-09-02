import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { notFound, badRequest, route } from "@/lib/api/respond";
import type { ShipmentDoc, ShipmentEventDoc } from "@/lib/db/types";

/**
 * GET /api/track/{code} — public tracking.
 *
 * Deliberately sanitised: route cities only, partially masked names, and no
 * street addresses, phone numbers or prices. Anyone can guess at codes, so this
 * response is the whole public surface of a shipment.
 *
 * Unpaid drafts return 404 — a shipment does not exist publicly until it is
 * paid for.
 */

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : (d ?? "") as string);

/** "John Michael Smith" -> "John M. S." */
function mask(name: unknown): string {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return parts.map((p, i) => (i === 0 ? p : `${p[0].toUpperCase()}.`)).join(" ");
}

const place = (...parts: unknown[]) => parts.filter(Boolean).join(", ");

export const GET = route(async (_req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code: raw } = await ctx.params;
  const code = decodeURIComponent(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code || code.length > 32) return badRequest("Enter a tracking number.");

  const shipments = await coll<ShipmentDoc>(C.shipments);
  const s = await shipments.findOne({ tracking_code: code });

  if (!s || s.status === "draft") {
    return notFound("No shipment found for that tracking number.");
  }

  const events = await coll<ShipmentEventDoc>(C.shipmentEvents);
  const timeline = await events
    .find({ shipment: String(s._id) })
    .sort({ occurred_at: -1 })
    .limit(200)
    .toArray();

  return Response.json({
    tracking_code: s.tracking_code,
    status: s.status,
    service_type: s.service_type,
    package_type: s.package_type,
    pieces: s.pieces,
    weight_kg: s.weight_kg,
    chargeable_kg: s.chargeable_kg,
    is_international: s.is_international,
    current_location: s.current_location,
    estimated_delivery: iso(s.estimated_delivery),
    shipped_at: iso(s.shipped_at),
    delivered_at: iso(s.delivered_at),
    created: iso(s.created),
    origin: place(s.sender_city, s.sender_state, s.sender_country),
    destination: place(s.receiver_city, s.receiver_state, s.receiver_country),
    sender_name: mask(s.sender_name),
    receiver_name: mask(s.receiver_name),
    events: timeline.map((e) => ({
      status: e.status,
      location: e.location,
      description: e.description,
      occurred_at: iso(e.occurred_at),
    })),
  });
});
