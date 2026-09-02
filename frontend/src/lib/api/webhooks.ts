import crypto from "node:crypto";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { stamps, touch } from "@/lib/db/serialize";
import type { OrderDoc, PaymentDoc, WebhookEventDoc } from "@/lib/db/types";

/**
 * Webhook plumbing.
 *
 * Signatures are verified against the RAW request body — re-serialising parsed
 * JSON would change byte-for-byte content and break the HMAC, so every handler
 * reads `await req.text()` and parses only afterwards.
 */

export function hmac(algo: "sha256" | "sha512", raw: string, secret: string): string {
  return crypto.createHmac(algo, secret).update(raw, "utf8").digest("hex");
}

/** Constant-time compare of two hex digests. */
export function safeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** Plain-string compare (Flutterwave sends the secret itself, not a digest). */
export function safeEqualStr(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Record a delivery. Returns true when this event has been seen before, so the
 * caller can ignore replays — providers retry aggressively.
 */
export async function alreadyProcessed(
  provider: string,
  eventId: string,
  eventType: string,
  payload: unknown
): Promise<boolean> {
  const events = await coll<WebhookEventDoc>(C.webhookEvents);
  try {
    await events.insertOne({
      provider,
      event_id: eventId,
      event_type: eventType,
      payload,
      processed: false,
      ...stamps(),
    } as WebhookEventDoc);
    return false;
  } catch (err) {
    // Duplicate key on (provider, event_id) means we have handled this already.
    if ((err as { code?: number }).code === 11000) return true;
    throw err;
  }
}

export async function findOrderByReference(ref: string): Promise<OrderDoc | null> {
  if (!ref) return null;
  const orders = await coll<OrderDoc>(C.orders);
  return orders.findOne({ $or: [{ payment_reference: ref }, { order_number: ref }] });
}

/** Mark an order paid and write the matching payments row. */
export async function markOrderPaid(
  order: OrderDoc,
  provider: string,
  reference: string,
  transactionId: string,
  amount: number,
  currency: string,
  raw: unknown
): Promise<void> {
  const orders = await coll<OrderDoc>(C.orders);
  await orders.updateOne(
    { _id: order._id },
    {
      $set: {
        payment_status: "paid",
        status: "paid",
        payment_provider: provider as OrderDoc["payment_provider"],
        ...(reference ? { payment_reference: reference } : {}),
        paid_at: new Date(),
        ...touch(),
      },
    }
  );

  const payments = await coll<PaymentDoc>(C.payments);
  await payments.insertOne({
    order: String(order._id),
    user: order.user,
    provider,
    provider_reference: reference,
    provider_transaction_id: transactionId,
    currency,
    amount,
    status: "succeeded",
    raw_response: raw,
    captured_at: new Date(),
    ...stamps(),
  } as PaymentDoc);
}
