import { z } from "zod";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toObjectId, stamps, touch } from "@/lib/db/serialize";
import { currentSession } from "@/lib/auth/session";
import { ok, fail, badRequest, notFound, forbidden, unauthorized, fromZod, route } from "@/lib/api/respond";
import type { LogisticsSettingsDoc, ShipmentDoc, ShipmentPaymentDoc } from "@/lib/db/types";

/**
 * POST /api/logistics/pay — start (or resume) a payment for a shipment.
 *
 * Bank transfer hands back the company account. PaymentPoint provisions a
 * one-time virtual account through their API. Either way the amount comes from
 * the stored shipment, never from the request body.
 */

const schema = z.object({
  shipment_id: z.string().min(1),
  method: z.enum(["paymentpoint", "bank_transfer"]).default("bank_transfer"),
});

export const POST = route(async (req: Request) => {
  const s = await currentSession();
  if (!s) return unauthorized("Sign in to pay for a shipment.");

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fromZod(parsed.error);
  const { shipment_id, method } = parsed.data;

  const _id = toObjectId(shipment_id);
  if (!_id) return notFound("Shipment not found.");

  const shipments = await coll<ShipmentDoc>(C.shipments);
  const shipment = await shipments.findOne({ _id });
  if (!shipment) return notFound("Shipment not found.");

  if (shipment.user !== s.uid && s.role !== "admin") {
    return forbidden("That shipment is not yours.");
  }
  if (shipment.payment_status === "paid") {
    return badRequest("This shipment is already paid for.");
  }

  const settingsColl = await coll<LogisticsSettingsDoc>(C.logisticsSettings);
  const cfg = await settingsColl.findOne({ key: "default" });
  if (!cfg) return fail(503, "Payments are not configured yet.");

  const amount = shipment.total_cost ?? 0;
  const currency = shipment.currency || cfg.payment_currency || "NGN";

  const payments = await coll<ShipmentPaymentDoc>(C.shipmentPayments);

  // Reuse the open attempt rather than piling up abandoned rows.
  const existing = await payments.findOne({
    shipment: String(shipment._id),
    method,
    status: { $in: ["pending", "awaiting_confirmation"] },
  });

  let payment: ShipmentPaymentDoc & { _id: NonNullable<ShipmentPaymentDoc["_id"]> };

  if (existing) {
    await payments.updateOne({ _id: existing._id }, { $set: { amount, currency, ...touch() } });
    payment = { ...existing, amount, currency };
  } else {
    const doc: ShipmentPaymentDoc = {
      shipment: String(shipment._id),
      user: shipment.user,
      method,
      status: "pending",
      amount,
      currency,
      reference: shipment.tracking_code,
      ...stamps(),
    };
    const res = await payments.insertOne(doc);
    payment = { ...doc, _id: res.insertedId };
  }

  /* ------------------------------------------------------- bank transfer */
  if (method === "bank_transfer") {
    if (!cfg.bank_transfer_enabled || !cfg.bank_account_number) {
      return fail(503, "Bank transfer is unavailable right now.");
    }
    return ok({
      payment_id: String(payment._id),
      method,
      status: payment.status,
      amount,
      currency,
      reference: payment.reference,
      bank: {
        bank_name: cfg.bank_name,
        account_name: cfg.bank_account_name,
        account_number: cfg.bank_account_number,
        branch: cfg.bank_branch,
        swift: cfg.bank_swift,
        instructions: cfg.bank_instructions,
      },
    });
  }

  /* --------------------------------------------------------- PaymentPoint */
  const apiKey = process.env.PAYMENTPOINT_API_KEY || cfg.paymentpoint_api_key;
  const businessId = process.env.PAYMENTPOINT_BUSINESS_ID || cfg.paymentpoint_business_id;
  const baseUrl = (cfg.paymentpoint_base_url || "https://api.paymentpoint.co/api/v1").replace(/\/+$/, "");

  if (!cfg.paymentpoint_enabled || !apiKey || !businessId) {
    return fail(503, "PaymentPoint is unavailable right now.");
  }

  // An account already issued for this attempt is reused.
  if (payment.virtual_account_number) {
    return ok({
      payment_id: String(payment._id),
      method,
      status: payment.status,
      amount,
      currency,
      reference: payment.reference,
      virtual_account: {
        bank_name: payment.virtual_account_bank,
        account_name: payment.virtual_account_name,
        account_number: payment.virtual_account_number,
      },
    });
  }

  const body: Record<string, unknown> = {
    email: shipment.sender_email || s.email,
    name: shipment.sender_name || "Veloxa customer",
    phone: shipment.sender_phone || "",
    businessid: businessId,
    amount,
    currency,
    reference: payment.reference,
  };
  if (cfg.paymentpoint_bank_code) body.bankcode = [cfg.paymentpoint_bank_code];

  let data: Record<string, unknown>;
  try {
    const res = await fetch(`${baseUrl}/createVirtualAccount`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "api-key": apiKey,
        businessid: businessId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.error("[paymentpoint] status", res.status, await res.text().catch(() => ""));
      return fail(502, "PaymentPoint rejected the request. Try bank transfer.");
    }
    data = (await res.json()) as Record<string, unknown>;
  } catch (err) {
    console.error("[paymentpoint] request failed", err);
    return fail(502, "Could not reach PaymentPoint. Try bank transfer.");
  }

  // The account is nested under different keys across API versions — accept the
  // shapes we know rather than hard-failing on one.
  const acct =
    (Array.isArray(data.bankAccounts) && data.bankAccounts[0]) ||
    (Array.isArray(data.bank_accounts) && data.bank_accounts[0]) ||
    (data.account as Record<string, unknown>) ||
    (data.data as Record<string, unknown>) ||
    data;

  const a = acct as Record<string, unknown>;
  const accountNumber = String(a.accountNumber ?? a.account_number ?? "");
  if (!accountNumber) {
    console.error("[paymentpoint] no account in response", data);
    return fail(502, "PaymentPoint returned no account. Try bank transfer.");
  }

  await payments.updateOne(
    { _id: payment._id },
    {
      $set: {
        virtual_account_bank: String(a.bankName ?? a.bank_name ?? ""),
        virtual_account_name: String(a.accountName ?? a.account_name ?? ""),
        virtual_account_number: accountNumber,
        provider_payload: data,
        ...touch(),
      },
    }
  );

  return ok({
    payment_id: String(payment._id),
    method,
    status: payment.status,
    amount,
    currency,
    reference: payment.reference,
    virtual_account: {
      bank_name: String(a.bankName ?? a.bank_name ?? ""),
      account_name: String(a.accountName ?? a.account_name ?? ""),
      account_number: accountNumber,
    },
  });
});
