import { z } from "zod";
import { priceShipment } from "@/lib/logistics/pricing";
import { badRequest, fromZod, route } from "@/lib/api/respond";

/**
 * POST /api/logistics/quote — price a shipment without creating one.
 *
 * Public: it reveals nothing but the rate card, and the booking form calls it
 * on every keystroke to keep the quote live.
 */

const schema = z.object({
  service_type: z.string().optional(),
  pieces: z.coerce.number().optional(),
  weight_kg: z.coerce.number(),
  length_cm: z.coerce.number().optional(),
  width_cm: z.coerce.number().optional(),
  height_cm: z.coerce.number().optional(),
  declared_value: z.coerce.number().optional(),
  insured: z.boolean().optional(),
  fragile: z.boolean().optional(),
  signature_required: z.boolean().optional(),
  sender_country: z.string().optional(),
  receiver_country: z.string().optional(),
  currency: z.string().optional(),
});

export const POST = route(async (req: Request) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fromZod(parsed.error);

  const b = parsed.data;
  if (!b.weight_kg || b.weight_kg <= 0) return badRequest("Enter a package weight.");

  const p = priceShipment({ ...b, service_type: b.service_type ?? "standard" });

  return Response.json({
    currency: (b.currency ?? "USD").toUpperCase(),
    volumetric_kg: p.volumetric_kg,
    chargeable_kg: p.chargeable_kg,
    is_international: p.is_international,
    shipping_cost: p.shipping_cost,
    insurance_fee: p.insurance_fee,
    tax_total: p.tax_total,
    total_cost: p.total_cost,
    transit_days: p.transit_days,
    estimated_delivery: p.estimated_delivery.toISOString(),
  });
});
