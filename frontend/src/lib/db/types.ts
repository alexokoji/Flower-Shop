import type { ObjectId } from "mongodb";

/**
 * Server-side document shapes — what actually sits in MongoDB.
 *
 * These differ from the client types in src/types in two ways: dates are real
 * `Date` objects (serialised to ISO strings on the way out), and relations are
 * stored as the related document's id string. `src/lib/db/serialize.ts` bridges
 * the two.
 *
 * Nothing here should ever reach the browser directly — `password_hash` and the
 * PaymentPoint keys live in these shapes.
 */

export interface Timestamps {
  created: Date;
  updated: Date;
}

export interface UserDoc extends Timestamps {
  _id?: ObjectId;
  email: string;
  /** bcrypt hash. Never serialised to a client. */
  password_hash: string;
  role: "customer" | "admin";
  first_name: string;
  last_name: string;
  phone: string;
  verified: boolean;
  marketing_opt_in: boolean;
  preferred_currency: string;
  locale: string;
  last_login_at?: Date;
  /** Single-use tokens for email verification / password reset. */
  verify_token?: string;
  reset_token?: string;
  reset_expires?: Date;
}

export interface CategoryDoc extends Timestamps {
  _id?: ObjectId;
  type: "flower" | "necklace";
  name: string;
  slug: string;
  description: string;
  image: string;
  image_url?: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
}

export interface ProductDoc extends Timestamps {
  _id?: ObjectId;
  category: string;
  type: "flower" | "necklace";
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  currency: string;
  price: number;
  sale_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  status: "in_stock" | "out_of_stock" | "preorder" | "draft" | "archived";
  is_featured: boolean;
  is_best_seller: boolean;
  attributes: Record<string, unknown>;
  images: string[];
  image_urls: string[] | null;
  weight_g: number;
  ships_internationally: boolean;
  restricted_countries: string[] | null;
  delivery_estimate: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string[] | null;
  sales_count: number;
  view_count: number;
  rating_avg: number;
  rating_count: number;
}

export interface AddressDoc extends Timestamps {
  _id?: ObjectId;
  user: string;
  label: string;
  first_name: string;
  last_name: string;
  phone: string;
  street_address: string;
  apartment: string;
  city: string;
  state: string;
  postal_code: string;
  country_iso2: string;
  landmark: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

export interface ShippingRateDoc extends Timestamps {
  _id?: ObjectId;
  country_iso2: string;
  method: "standard" | "express";
  base_fee: number;
  per_kg_fee: number;
  min_fee: number;
  max_fee: number;
  free_threshold: number;
  delivery_days: string;
  currency: string;
  is_active: boolean;
}

export interface CouponDoc extends Timestamps {
  _id?: ObjectId;
  code: string;
  type: "fixed" | "percent";
  value: number;
  min_subtotal: number;
  max_uses: number;
  max_uses_per_user: number;
  used_count: number;
  starts_at?: Date;
  ends_at?: Date;
  is_active: boolean;
  restrictions?: Record<string, unknown>;
}

export interface OrderDoc extends Timestamps {
  _id?: ObjectId;
  order_number: string;
  user?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_first_name?: string;
  guest_last_name?: string;
  currency: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  coupon?: string;
  coupon_code_snapshot?: string;
  shipping_method: "standard" | "express";
  shipping_country_iso2: string;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  items: Record<string, unknown>[];
  status:
    | "pending" | "paid" | "processing" | "packed" | "shipped"
    | "in_transit" | "delivered" | "cancelled" | "refunded";
  payment_status: "unpaid" | "paid" | "partially_refunded" | "refunded" | "failed";
  payment_provider?: "paystack" | "flutterwave" | "monnify";
  payment_reference?: string;
  tracking_id?: string;
  tracking_url?: string;
  admin_notes?: string;
  customer_notes?: string;
  placed_at?: Date;
  paid_at?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
  cancelled_at?: Date;
}

export interface ShipmentTrackingDoc extends Timestamps {
  _id?: ObjectId;
  order: string;
  status: string;
  location: string;
  description: string;
  occurred_at: Date;
}

export interface ReviewDoc extends Timestamps {
  _id?: ObjectId;
  product: string;
  user: string;
  rating: number;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  photos: string[];
  approved_at?: Date;
}

export interface PaymentDoc extends Timestamps {
  _id?: ObjectId;
  order: string;
  user?: string;
  provider: string;
  provider_reference?: string;
  provider_transaction_id?: string;
  currency: string;
  amount: number;
  status: string;
  raw_response?: unknown;
  authorized_at?: Date;
  captured_at?: Date;
  refunded_at?: Date;
  failure_reason?: string;
}

export interface WebhookEventDoc extends Timestamps {
  _id?: ObjectId;
  provider: string;
  event_id: string;
  event_type: string;
  payload: unknown;
  processed: boolean;
  processing_error?: string;
}

export interface WishlistDoc extends Timestamps {
  _id?: ObjectId;
  user: string;
  product: string;
}

export interface CartDoc extends Timestamps {
  _id?: ObjectId;
  user: string;
  currency: string;
  coupon_code: string;
  items: Record<string, unknown>[];
}

export type ShipmentStatus =
  | "draft" | "pending_pickup" | "picked_up" | "in_transit" | "at_facility"
  | "out_for_delivery" | "delivered" | "on_hold" | "exception" | "returned" | "cancelled";

export interface ShipmentDoc extends Timestamps {
  _id?: ObjectId;
  tracking_code: string;
  user: string;
  reference: string;
  service_type: "same_day" | "overnight" | "express" | "standard" | "economy" | "freight";
  package_type: "parcel" | "envelope" | "document" | "box" | "pallet" | "crate";

  sender_name: string; sender_company: string; sender_phone: string; sender_email: string;
  sender_address: string; sender_city: string; sender_state: string;
  sender_postal_code: string; sender_country: string;

  receiver_name: string; receiver_company: string; receiver_phone: string; receiver_email: string;
  receiver_address: string; receiver_city: string; receiver_state: string;
  receiver_postal_code: string; receiver_country: string;

  pieces: number;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  volumetric_kg: number;
  chargeable_kg: number;
  contents: string;
  declared_value: number;

  fragile: boolean;
  insured: boolean;
  signature_required: boolean;
  is_international: boolean;

  currency: string;
  shipping_cost: number;
  insurance_fee: number;
  tax_total: number;
  total_cost: number;
  payment_method: "prepaid" | "collect_on_delivery" | "invoice";
  payment_status: "unpaid" | "paid" | "refunded";

  status: ShipmentStatus;
  current_location: string;
  notes: string;

  pickup_date?: Date;
  estimated_delivery?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
  /** Unguessable token gating the shareable receipt. */
  public_token: string;
}

export interface ShipmentEventDoc extends Timestamps {
  _id?: ObjectId;
  shipment: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  occurred_at: Date;
  created_by?: string;
}

export interface ShipmentPaymentDoc extends Timestamps {
  _id?: ObjectId;
  shipment: string;
  user: string;
  method: "paymentpoint" | "bank_transfer";
  status: "pending" | "awaiting_confirmation" | "paid" | "failed" | "cancelled";
  amount: number;
  currency: string;
  reference: string;
  payer_name?: string;
  paid_from_bank?: string;
  transfer_reference?: string;
  proof?: string;
  virtual_account_bank?: string;
  virtual_account_name?: string;
  virtual_account_number?: string;
  provider_payload?: unknown;
  admin_note?: string;
  paid_at?: Date;
}

/** Admin-only. Holds PaymentPoint credentials — never serialise wholesale. */
export interface LogisticsSettingsDoc extends Timestamps {
  _id?: ObjectId;
  key: string;
  bank_transfer_enabled: boolean;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  bank_swift: string;
  bank_instructions: string;
  paymentpoint_enabled: boolean;
  paymentpoint_business_id: string;
  paymentpoint_api_key: string;
  paymentpoint_secret_key: string;
  paymentpoint_base_url: string;
  paymentpoint_bank_code: string;
  payment_currency: string;
  support_email: string;
  support_phone: string;
}
