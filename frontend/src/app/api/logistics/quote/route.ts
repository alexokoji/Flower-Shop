import { z } from "zod";
import { priceShipment, getFlatFee } from "@/lib/logistics/pricing";
import { badRequest, fromZod, route } from "@/lib/api/respond";

/**
 * POST /api/logistics/quote — price a shipment without creating one.
 *
 * Every shipment costs the admin-configured flat fee, so the "quote" is really
 * a confirmation of that fee plus the transit estimate for the chosen service.
 * It reads the same value the create hook uses, so what is quoted is charged.
 */

const schema = z.object({
  service_type: z.string().optional(),
  pieces: z.coerce.number().optional(),
  weight_kg: z.coerce.number(),
  length_cm: z.coerce.number().optional(),
  width_cm: z.coerce.number().optional(),
  height_cm: z.coerce.number().optional(),
  sender_country: z.string().optional(),
  receiver_country: z.string().optional(),
  // Accepted and ignored: they no longer influence the price.
  declared_value: z.coerce.number().optional(),
  insured: z.boolean().optional(),
  fragile: z.boolean().optional(),
  signature_required: z.boolean().optional(),
  currency: z.string().optional(),
});

export const POST = route(async (req: Request) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fromZod(parsed.error);

  const b = parsed.data;
  if (!b.weight_kg || b.weight_kg <= 0) return badRequest("Enter a package weight.");

  const { fee, currency } = await getFlatFee();
  const p = priceShipment({ ...b, service_type: b.service_type ?? "standard" }, fee);

  return Response.json({
    currency,
    volumetric_kg: p.volumetric_kg,
    chargeable_kg: p.chargeable_kg,
    is_international: p.is_international,
    shipping_cost: p.shipping_cost,
    insurance_fee: p.insurance_fee,
    tax_total: p.tax_total,
    total_cost: p.total_cost,
    transit_days: p.transit_days,
    estimated_delivery: p.estimated_delivery.toISOString(),
    flat_rate: true,
  });
});
