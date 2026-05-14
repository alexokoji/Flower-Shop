// Types align with PocketBase records.
export type ProductType = "flower" | "necklace";
export type ProductStatus = "in_stock" | "out_of_stock" | "preorder" | "draft" | "archived";

export interface PbRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
}

export interface Category extends PbRecord {
  type: ProductType;
  name: string;
  slug: string;
  description: string;
  image: string;            // filename within the record
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
}

export interface FlowerAttributes {
  flower_type?: string;
  color?: string;
  occasion?: string;
  freshness_days?: number;
  care_instructions?: string;
}

export interface NecklaceAttributes {
  material?: string;
  stone_type?: string;
  chain_length_cm?: number;
  gender?: string;
  weight_g?: number;
  color?: string;
}

export interface Product extends PbRecord {
  category: string;          // category record id
  type: ProductType;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  currency: string;
  price: number;
  sale_price: number;        // 0 when no sale
  stock_quantity: number;
  low_stock_threshold: number;
  status: ProductStatus;
  is_featured: boolean;
  is_best_seller: boolean;
  attributes: FlowerAttributes | NecklaceAttributes | Record<string, unknown>;
  images: string[];          // filenames
  image_urls: string[] | null; // curated remote URLs (preferred over file uploads)
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
  expand?: { category?: Category };
}

export interface User extends PbRecord {
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: "customer" | "admin";
  preferred_currency: string;
  locale: string;
  marketing_opt_in: boolean;
  last_login_at: string | null;
}

export interface Address extends PbRecord {
  user: string;
  label: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_iso2: string;
  state: string;
  city: string;
  street_address: string;
  apartment: string;
  postal_code: string;
  landmark: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

export interface ShippingRate extends PbRecord {
  country_iso2: string;
  method: "standard" | "express";
  currency: string;
  base_fee: number;
  per_kg_fee: number;
  min_fee: number;
  max_fee: number;
  free_threshold: number;
  delivery_days: string;
  is_active: boolean;
}

export type OrderStatus =
  | "pending" | "paid" | "processing" | "packed"
  | "shipped" | "in_transit" | "delivered" | "cancelled" | "refunded";

export interface OrderLine {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_type: ProductType;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order extends PbRecord {
  order_number: string;
  user: string | null;
  guest_email: string;
  currency: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  status: OrderStatus;
  payment_status: "unpaid" | "paid" | "partially_refunded" | "refunded" | "failed";
  payment_provider: "paystack" | "flutterwave" | "monnify" | "";
  payment_reference: string;
  shipping_method: "standard" | "express";
  shipping_country_iso2: string;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  items: OrderLine[];
  placed_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface PbList<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export interface Country {
  iso2: string;
  iso3: string;
  name: string;
  phone_code: string;
  currency: string;
  region: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  is_base?: boolean;
}
