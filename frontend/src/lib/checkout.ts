import { pbCall } from "@/lib/pb";

export interface CheckoutLine { product_id: string; quantity: number }

export interface CheckoutPayload {
  items: CheckoutLine[];
  currency: string;
  coupon_code?: string;
  shipping: {
    country_iso2: string;
    method: "standard" | "express";
    address: Record<string, string>;
  };
  billing?: Record<string, string>;
  customer_notes?: string;
  guest?: { email: string; phone: string; first_name: string; last_name: string };
}

export interface CheckoutResponse {
  id: string;
  order_number: string;
  grand_total: number;
  currency: string;
  delivery_days: string;
  rate_currency: string;
}

export function placeOrder(payload: CheckoutPayload): Promise<CheckoutResponse> {
  return pbCall<CheckoutResponse>("/api/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ShippingEstimate {
  eligible: boolean;
  reason?: string;
  method?: string;
  country?: string;
  currency?: string;
  fee?: number;
  delivery_days?: string;
  total_weight_kg?: number;
}

export function estimateShipping(country: string, method: "standard" | "express", items: CheckoutLine[]): Promise<ShippingEstimate> {
  return pbCall<ShippingEstimate>("/api/shipping/estimate", {
    method: "POST",
    body: JSON.stringify({ country, method, items }),
  });
}