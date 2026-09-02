import { z } from "zod";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toObjectId, touch } from "@/lib/db/serialize";
import { currentSession } from "@/lib/auth/session";
import { ok, badRequest, notFound, forbidden, unauthorized, fromZod, route } from "@/lib/api/respond";
import type { ShipmentPaymentDoc } from "@/lib/db/types";

/**
 * POST /api/logistics/pay/declare — the customer states they have transferred.
 *
 * This can only ever move a payment to `awaiting_confirmation`. Marking one
 * `paid` — which activates the shipment — is reserved for an admin or the
 * PaymentPoint webhook.
 */

const schema = z.object({
  payment_id: z.string().min(1),
  payer_name: z.string().max(120).optional(),
  bank: z.string().max(120).optional(),
  transfer_reference: z.string().max(120).optional(),
});

export const POST = route(async (req: Request) => {
  const s = await currentSession();
  if (!s) return unauthorized("Sign in first.");

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fromZod(parsed.error);
  const b = parsed.data;

  const _id = toObjectId(b.payment_id);
  if (!_id) return notFound("Payment not found.");

  const payments = await coll<ShipmentPaymentDoc>(C.shipmentPayments);
  const payment = await payments.findOne({ _id });
  if (!payment) return notFound("Payment not found.");

  if (payment.user !== s.uid && s.role !== "admin") {
    return forbidden("That payment is not yours.");
  }
  if (payment.status === "paid") {
    return badRequest("This payment is already confirmed.");
  }

  await payments.updateOne(
    { _id },
    {
      $set: {
        payer_name: (b.payer_name ?? "").slice(0, 120),
        paid_from_bank: (b.bank ?? "").slice(0, 120),
        transfer_reference: (b.transfer_reference ?? "").slice(0, 120),
        status: "awaiting_confirmation",
        ...touch(),
      },
    }
  );

  return ok({ payment_id: b.payment_id, status: "awaiting_confirmation" });
});
