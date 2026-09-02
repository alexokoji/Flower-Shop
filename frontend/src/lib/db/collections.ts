import type { IndexDescription } from "mongodb";
import { db } from "@/lib/db/mongo";

/**
 * The 16 collections carried over from PocketBase, with the indexes that were
 * previously declared in pb_migrations. Names are unchanged so existing queries
 * and mental models still line up.
 */
export const C = {
  users: "users",
  categories: "categories",
  products: "products",
  addresses: "addresses",
  shippingRates: "shipping_rates",
  coupons: "coupons",
  orders: "orders",
  shipmentTracking: "shipment_tracking",
  reviews: "reviews",
  payments: "payments",
  webhookEvents: "payment_webhook_events",
  wishlists: "wishlists",
  carts: "carts",
  shipments: "shipments",
  shipmentEvents: "shipment_events",
  shipmentPayments: "shipment_payments",
  logisticsSettings: "logistics_settings",
  notifications: "notifications",
} as const;

const INDEXES: Record<string, IndexDescription[]> = {
  [C.users]: [
    { key: { email: 1 }, unique: true, name: "uniq_users_email" },
    { key: { role: 1 }, name: "idx_users_role" },
  ],
  [C.categories]: [
    { key: { slug: 1 }, unique: true, name: "uniq_categories_slug" },
    { key: { type: 1, is_active: 1 }, name: "idx_categories_type_active" },
  ],
  [C.products]: [
    { key: { slug: 1 }, unique: true, name: "uniq_products_slug" },
    { key: { sku: 1 }, unique: true, name: "uniq_products_sku" },
    { key: { type: 1, status: 1 }, name: "idx_products_type_status" },
    { key: { category: 1 }, name: "idx_products_category" },
    // Powers the search overlay.
    { key: { name: "text", short_description: "text" }, name: "text_products_search" },
  ],
  [C.addresses]: [{ key: { user: 1 }, name: "idx_addresses_user" }],
  [C.shippingRates]: [
    { key: { country_iso2: 1, method: 1 }, unique: true, name: "uniq_rates_country_method" },
  ],
  [C.coupons]: [{ key: { code: 1 }, unique: true, name: "uniq_coupons_code" }],
  [C.orders]: [
    { key: { order_number: 1 }, unique: true, name: "uniq_orders_number" },
    { key: { user: 1 }, name: "idx_orders_user" },
    { key: { status: 1 }, name: "idx_orders_status" },
    { key: { payment_status: 1 }, name: "idx_orders_payment_status" },
  ],
  [C.shipmentTracking]: [{ key: { order: 1, occurred_at: -1 }, name: "idx_tracking_order" }],
  [C.reviews]: [
    { key: { product: 1, status: 1 }, name: "idx_reviews_product_status" },
    { key: { user: 1 }, name: "idx_reviews_user" },
  ],
  [C.payments]: [{ key: { order: 1 }, name: "idx_payments_order" }],
  [C.webhookEvents]: [
    { key: { provider: 1, event_id: 1 }, unique: true, name: "uniq_webhook_provider_event" },
  ],
  [C.wishlists]: [{ key: { user: 1, product: 1 }, unique: true, name: "uniq_wishlist_user_product" }],
  [C.carts]: [{ key: { user: 1 }, unique: true, name: "uniq_carts_user" }],
  [C.shipments]: [
    { key: { tracking_code: 1 }, unique: true, name: "uniq_shipments_tracking_code" },
    { key: { user: 1 }, name: "idx_shipments_user" },
    { key: { status: 1 }, name: "idx_shipments_status" },
    { key: { public_token: 1 }, name: "idx_shipments_public_token" },
  ],
  [C.shipmentEvents]: [{ key: { shipment: 1, occurred_at: -1 }, name: "idx_shipment_events" }],
  [C.shipmentPayments]: [
    { key: { shipment: 1 }, name: "idx_shipment_payments_shipment" },
    { key: { status: 1 }, name: "idx_shipment_payments_status" },
    { key: { reference: 1 }, name: "idx_shipment_payments_reference" },
  ],
  [C.logisticsSettings]: [{ key: { key: 1 }, unique: true, name: "uniq_logistics_settings_key" }],
  [C.notifications]: [
    { key: { notifiable_id: 1, notifiable_type: 1, created: -1 }, name: "idx_notifications_owner" },
  ],
};

/**
 * Create every index. Safe to call repeatedly — MongoDB ignores an index that
 * already exists with the same spec. Run from `npm run db:setup`.
 */
export async function ensureIndexes(log: (msg: string) => void = console.log) {
  const database = await db();
  for (const [name, specs] of Object.entries(INDEXES)) {
    if (!specs.length) continue;
    try {
      await database.collection(name).createIndexes(specs);
      log(`  indexes ok: ${name} (${specs.length})`);
    } catch (err) {
      log(`  FAILED: ${name} — ${(err as Error).message}`);
    }
  }
}
