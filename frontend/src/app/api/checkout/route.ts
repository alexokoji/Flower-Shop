import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toObjectId, stamps } from "@/lib/db/serialize";
import { currentSession } from "@/lib/auth/session";
import { badRequest, notFound, unauthorized, route } from "@/lib/api/respond";
import type { CouponDoc, OrderDoc, ProductDoc, ShippingRateDoc } from "@/lib/db/types";

/**
 * POST /api/checkout — create an order from a cart.
 *
 * Ported from the PocketBase hook, and for the same reason it existed there:
 * every price, shipping fee and discount is recomputed from the database. The
 * client's totals are read for nothing but comparison — a tampered cart cannot
 * change what is charged.
 */

interface CartLine {
  product_id: string;
  quantity: number;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function orderNumber(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return `FS-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const POST = route(async (req: Request) => {
  const body = (await req.json()) as Record<string, unknown>;

  const items = Array.isArray(body.items) ? (body.items as CartLine[]) : [];
  if (!items.length) return badRequest("Cart is empty.");

  const currency = String(body.currency ?? "USD").toUpperCase();
  const shipping = (body.shipping ?? {}) as Record<string, unknown>;
  const country = String(shipping.country_iso2 ?? "").toUpperCase();
  const method = shipping.method === "express" ? "express" : "standard";

  if (!country) return badRequest("Shipping country is required.");
  if (!shipping.address) return badRequest("Shipping address is required.");

  /* ------------------------------------------- price the lines from the DB */
  const products = await coll<ProductDoc>(C.products);
  let subtotal = 0;
  let weightKg = 0;
  const lines: Record<string, unknown>[] = [];

  for (const line of items) {
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 1));
    const _id = toObjectId(line.product_id);
    const product = _id ? await products.findOne({ _id }) : null;
    if (!product) return notFound(`Product not found: ${line.product_id}`);

    if (product.status === "draft" || product.status === "archived") {
      return badRequest(`Unavailable: ${product.name}`);
    }
    if (Array.isArray(product.restricted_countries) && product.restricted_countries.includes(country)) {
      return badRequest(`Cannot ship "${product.name}" to ${country}.`);
    }

    const unit = product.sale_price > 0 ? product.sale_price : product.price;
    subtotal += unit * qty;
    weightKg += ((product.weight_g || 0) / 1000) * qty;

    lines.push({
      product_id: String(product._id),
      product_name: product.name,
      product_sku: product.sku,
      product_type: product.type,
      unit_price: unit,
      quantity: qty,
      line_total: round2(unit * qty),
    });
  }
  subtotal = round2(subtotal);

  /* --------------------------------------------------------- shipping fee */
  let shippingFee = 15;
  let deliveryDays = "7-14";
  let rateCurrency = "USD";

  const rates = await coll<ShippingRateDoc>(C.shippingRates);
  const rate = await rates.findOne({ country_iso2: country, method, is_active: true });
  if (rate) {
    shippingFee = rate.base_fee + (rate.per_kg_fee || 0) * weightKg;
    if (rate.min_fee) shippingFee = Math.max(shippingFee, rate.min_fee);
    if (rate.max_fee) shippingFee = Math.min(shippingFee, rate.max_fee);
    if (rate.free_threshold && subtotal >= rate.free_threshold) shippingFee = 0;
    deliveryDays = rate.delivery_days || deliveryDays;
    rateCurrency = rate.currency || "USD";
  }
  shippingFee = round2(shippingFee);

  /* -------------------------------------------------------------- coupon */
  let discountTotal = 0;
  let couponId: string | undefined;
  let couponSnapshot: string | undefined;

  if (body.coupon_code) {
    const coupons = await coll<CouponDoc>(C.coupons);
    const coupon = await coupons.findOne({
      code: String(body.coupon_code).toUpperCase(),
      is_active: true,
    });

    if (coupon) {
      const now = new Date();
      const startOk = !coupon.starts_at || new Date(coupon.starts_at) <= now;
      const endOk = !coupon.ends_at || new Date(coupon.ends_at) >= now;
      const minOk = !coupon.min_subtotal || subtotal >= coupon.min_subtotal;
      const usageOk = !coupon.max_uses || (coupon.used_count ?? 0) < coupon.max_uses;

      if (startOk && endOk && minOk && usageOk) {
        discountTotal =
          coupon.type === "fixed"
            ? Math.min(coupon.value, subtotal)
            : round2(subtotal * (coupon.value / 100));
        couponId = String(coupon._id);
        couponSnapshot = coupon.code;
      }
    }
  }

  const grand = round2(Math.max(0, subtotal + shippingFee - discountTotal));

  /* --------------------------------------------------------- who is this? */
  const s = await currentSession();
  const guest = (body.guest ?? null) as Record<string, unknown> | null;
  if (!s && !guest) return unauthorized("Sign in or provide guest details.");

  const order: OrderDoc = {
    order_number: orderNumber(),
    ...(s
      ? { user: s.uid }
      : {
          guest_email: String(guest?.email ?? ""),
          guest_phone: String(guest?.phone ?? ""),
          guest_first_name: String(guest?.first_name ?? ""),
          guest_last_name: String(guest?.last_name ?? ""),
        }),
    currency,
    subtotal,
    shipping_total: shippingFee,
    tax_total: 0,
    discount_total: discountTotal,
    grand_total: grand,
    ...(couponId ? { coupon: couponId, coupon_code_snapshot: couponSnapshot } : {}),
    shipping_method: method,
    shipping_country_iso2: country,
    shipping_address: shipping.address as Record<string, unknown>,
    billing_address: (body.billing ?? shipping.address) as Record<string, unknown>,
    items: lines,
    status: "pending",
    payment_status: "unpaid",
    customer_notes: body.customer_notes ? String(body.customer_notes) : undefined,
    placed_at: new Date(),
    ...stamps(),
  };

  const orders = await coll<OrderDoc>(C.orders);
  const res = await orders.insertOne(order);

  return Response.json(
    {
      id: String(res.insertedId),
      order_number: order.order_number,
      grand_total: grand,
      currency,
      delivery_days: deliveryDays,
      rate_currency: rateCurrency,
    },
    { status: 201 }
  );
});
