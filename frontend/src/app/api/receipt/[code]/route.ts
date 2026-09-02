import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { notFound, badRequest, route } from "@/lib/api/respond";
import type { ShipmentDoc } from "@/lib/db/types";

/**
 * GET /api/receipt/{code}?token= — the full consignment record, for sharing.
 *
 * Gated by the shipment's `public_token`, compared in constant time so the
 * endpoint cannot be used as an oracle to recover a token byte by byte. Every
 * failure returns the same 404 as an unknown code.
 */

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : (d ?? "") as string);

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const GET = route(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const { code: raw } = await ctx.params;
  const code = decodeURIComponent(raw ?? "").trim().toUpperCase();
  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";

  if (!code || !token) return badRequest("Missing tracking code or token.");

  const shipments = await coll<ShipmentDoc>(C.shipments);
  const s = await shipments.findOne({ tracking_code: code });

  if (!s || !safeEqual(String(s.public_token ?? ""), token)) {
    return notFound("Receipt not found.");
  }

  return Response.json({
    tracking_code: s.tracking_code,
    reference: s.reference ?? "",
    status: s.status,
    service_type: s.service_type,
    package_type: s.package_type,
    pieces: s.pieces,
    weight_kg: s.weight_kg,
    volumetric_kg: s.volumetric_kg,
    chargeable_kg: s.chargeable_kg,
    contents: s.contents,
    declared_value: s.declared_value,
    fragile: s.fragile,
    insured: s.insured,
    signature_required: s.signature_required,
    is_international: s.is_international,
    currency: s.currency,
    shipping_cost: s.shipping_cost,
    insurance_fee: s.insurance_fee,
    tax_total: s.tax_total,
    total_cost: s.total_cost,
    payment_method: s.payment_method,
    payment_status: s.payment_status,
    current_location: s.current_location,
    notes: s.notes ?? "",
    pickup_date: iso(s.pickup_date),
    estimated_delivery: iso(s.estimated_delivery),
    shipped_at: iso(s.shipped_at),
    delivered_at: iso(s.delivered_at),
    created: iso(s.created),

    sender_name: s.sender_name,
    sender_company: s.sender_company ?? "",
    sender_phone: s.sender_phone,
    sender_email: s.sender_email ?? "",
    sender_address: s.sender_address,
    sender_city: s.sender_city,
    sender_state: s.sender_state ?? "",
    sender_postal_code: s.sender_postal_code ?? "",
    sender_country: s.sender_country,

    receiver_name: s.receiver_name,
    receiver_company: s.receiver_company ?? "",
    receiver_phone: s.receiver_phone,
    receiver_email: s.receiver_email ?? "",
    receiver_address: s.receiver_address,
    receiver_city: s.receiver_city,
    receiver_state: s.receiver_state ?? "",
    receiver_postal_code: s.receiver_postal_code ?? "",
    receiver_country: s.receiver_country,
  });
});
