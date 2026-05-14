"use client";

import { useScript } from "@/hooks/use-script";

const PAYSTACK_SRC = "https://js.paystack.co/v2/inline.js";
const FLUTTERWAVE_SRC = "https://checkout.flutterwave.com/v3.js";
const MONNIFY_SRC = "https://sdk.monnify.com/plugin/monnify.js";

export type Provider = "paystack" | "flutterwave" | "monnify";

export function usePaymentSdk(provider: Provider | null) {
  const src =
    provider === "paystack" ? PAYSTACK_SRC
    : provider === "flutterwave" ? FLUTTERWAVE_SRC
    : provider === "monnify" ? MONNIFY_SRC
    : null;
  return useScript(src);
}

export interface PayParams {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  customer: { first_name: string; last_name: string; phone?: string };
  onSuccess: (txRef: string) => void;
  onClose?: () => void;
}

type PaystackResponse = { reference: string };
interface PaystackPopup {
  newTransaction(opts: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    onSuccess: (tx: PaystackResponse) => void;
    onCancel?: () => void;
  }): void;
}
declare global {
  interface Window {
    PaystackPop?: { new(): PaystackPopup };
    FlutterwaveCheckout?: (opts: Record<string, unknown>) => void;
    MonnifySDK?: { initialize: (opts: Record<string, unknown>) => void };
  }
}

export function payWithPaystack(params: PayParams) {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set.");
  if (!window.PaystackPop) throw new Error("Paystack SDK not loaded.");

  const popup = new window.PaystackPop();
  popup.newTransaction({
    key,
    email: params.email,
    amount: Math.round(params.amount * 100),
    currency: params.currency.toUpperCase(),
    ref: params.reference,
    firstname: params.customer.first_name,
    lastname: params.customer.last_name,
    phone: params.customer.phone,
    onSuccess: (tx) => params.onSuccess(tx.reference),
    onCancel: () => params.onClose?.(),
  });
}

export function payWithFlutterwave(params: PayParams) {
  const key = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY is not set.");
  if (!window.FlutterwaveCheckout) throw new Error("Flutterwave SDK not loaded.");

  window.FlutterwaveCheckout({
    public_key: key,
    tx_ref: params.reference,
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    payment_options: "card,banktransfer,ussd",
    customer: {
      email: params.email,
      phone_number: params.customer.phone ?? "",
      name: `${params.customer.first_name} ${params.customer.last_name}`.trim(),
    },
    customizations: {
      title: process.env.NEXT_PUBLIC_APP_NAME ?? "Xperience Delivery",
      description: `Order ${params.reference}`,
    },
    callback: (response: { tx_ref: string; status: string }) => {
      if (response.status === "successful" || response.status === "completed") {
        params.onSuccess(response.tx_ref);
      }
    },
    onclose: () => params.onClose?.(),
  });
}

export function payWithMonnify(params: PayParams) {
  const apiKey = process.env.NEXT_PUBLIC_MONNIFY_API_KEY;
  const contractCode = process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE;
  if (!apiKey || !contractCode) throw new Error("Monnify env vars are not set.");
  if (!window.MonnifySDK) throw new Error("Monnify SDK not loaded.");

  window.MonnifySDK.initialize({
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    reference: params.reference,
    customerFullName: `${params.customer.first_name} ${params.customer.last_name}`.trim(),
    customerEmail: params.email,
    customerMobileNumber: params.customer.phone ?? "",
    apiKey,
    contractCode,
    paymentDescription: `Order ${params.reference}`,
    onComplete: (response: { paymentReference?: string }) => {
      params.onSuccess(response.paymentReference ?? params.reference);
    },
    onClose: () => params.onClose?.(),
  });
}