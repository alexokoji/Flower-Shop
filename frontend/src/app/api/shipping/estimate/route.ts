import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toObjectId } from "@/lib/db/serialize";
import { badRequest, ok, route } from "@/lib/api/respond";
import type { ProductDoc, ShippingRateDoc } from "@/lib/db/types";

/**
 * POST /api/shipping/estimate — quote shipping without creating an order.
 *
 * Shares its arithmetic with /api/checkout so the figure shown at the cart is
 * the figure charged at checkout.
 */
export const POST = route(async (req: Request) => {
  const body = (await req.json()) as Record<string, unknown>;

  const items = Array.isArray(body.items)
    ? (body.items as { product_id: string; quantity: number }[])
    : [];
  const country = String(body.country ?? "").toUpperCase();
  const method = body.method === "express" ? "express" : "standard";
  if (!country) return badRequest("country is required");

  const products = await coll<ProductDoc>(C.products);
  let subtotal = 0;
  let weightKg = 0;

  for (const line of items) {
    const _id = toObjectId(line.product_id);
    const p = _id ? await products.findOne({ _id }) : null;
    if (!p) continue;

    if (Array.isArray(p.restricted_countries) && p.restricted_countries.includes(country)) {
      return ok({ eligible: false, reason: `Cannot ship "${p.name}" to ${country}.` });
    }

    const unit = p.sale_price > 0 ? p.sale_price : p.price;
    const q = Math.max(1, Math.floor(Number(line.quantity) || 1));
    subtotal += unit * q;
    weightKg += ((p.weight_g || 0) / 1000) * q;
  }

  let fee = 15;
  let days = "7-14";
  let currency = "USD";

  const rates = await coll<ShippingRateDoc>(C.shippingRates);
  const rate = await rates.findOne({ country_iso2: country, method, is_active: true });
  if (rate) {
    fee = rate.base_fee + (rate.per_kg_fee || 0) * weightKg;
    if (rate.min_fee) fee = Math.max(fee, rate.min_fee);
    if (rate.max_fee) fee = Math.min(fee, rate.max_fee);
    if (rate.free_threshold && subtotal >= rate.free_threshold) fee = 0;
    days = rate.delivery_days || days;
    currency = rate.currency || "USD";
  }

  return ok({
    eligible: true,
    method,
    country,
    currency,
    fee: Math.round(fee * 100) / 100,
    delivery_days: days,
    total_weight_kg: Math.round(weightKg * 1000) / 1000,
  });
});
