import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { touch } from "@/lib/db/serialize";
import { hmac, safeEqualHex, alreadyProcessed } from "@/lib/api/webhooks";
import { activateShipment } from "@/lib/api/hooks";
import type { LogisticsSettingsDoc, ShipmentPaymentDoc } from "@/lib/db/types";

/**
 * POST /api/webhooks/paymentpoint — settlement notification for a shipment.
 *
 * Marking the payment `paid` is what activates the shipment, through the same
 * `activateShipment` an admin confirmation uses, so both paths behave alike.
 */
export async function POST(req: Request) {
  const settings = await coll<LogisticsSettingsDoc>(C.logisticsSettings);
  const cfg = await settings.findOne({ key: "default" });
  const secret = process.env.PAYMENTPOINT_SECRET_KEY || cfg?.paymentpoint_secret_key;

  if (!secret) {
    return Response.json({ message: "PaymentPoint secret not configured." }, { status: 500 });
  }

  const raw = await req.text();
  const provided = (
    req.headers.get("paymentpoint-signature") ??
    req.headers.get("x-paymentpoint-signature") ??
    ""
  ).toLowerCase();

  if (!safeEqualHex(provided, hmac("sha256", raw, secret))) {
    return Response.json({ message: "Invalid signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ message: "Bad JSON." }, { status: 400 });
  }

  const tx = (payload.transaction ?? payload.data ?? payload) as Record<string, unknown>;
  const status = String(
    tx.transaction_status ?? tx.status ?? payload.notification_status ?? ""
  ).toLowerCase();

  const receiver = (tx.receiver ?? {}) as Record<string, unknown>;
  const accountNumber = String(
    receiver.account_number ?? receiver.accountNumber ?? tx.account_number ?? tx.accountNumber ?? ""
  );
  const reference = String(tx.transaction_id ?? tx.reference ?? tx.settlement_id ?? "");
  const amount = Number(tx.amount_paid ?? tx.amount ?? tx.settlement_amount ?? 0) || 0;

  const eventId = reference || `${accountNumber}:${amount}`;
  if (await alreadyProcessed("paymentpoint", eventId, status || "notification", payload)) {
    return Response.json({ message: "Duplicate ignored." });
  }

  const successful = ["success", "successful", "paid", "completed"].includes(status);
  if (!successful) return Response.json({ message: "Ignored non-success notification." });

  const payments = await coll<ShipmentPaymentDoc>(C.shipmentPayments);
  const payment =
    (accountNumber
      ? await payments.findOne({ virtual_account_number: accountNumber, status: { $ne: "paid" } })
      : null) ??
    (reference ? await payments.findOne({ reference, status: { $ne: "paid" } }) : null);

  if (!payment) return Response.json({ message: "No matching payment." });

  // An underpayment is flagged for a human rather than silently activating.
  if (amount > 0 && amount + 0.01 < (payment.amount ?? 0)) {
    await payments.updateOne(
      { _id: payment._id },
      {
        $set: {
          status: "awaiting_confirmation",
          admin_note: `Underpaid: received ${amount} of ${payment.amount}`,
          provider_payload: payload,
          ...touch(),
        },
      }
    );
    return Response.json({ message: "Underpayment flagged." });
  }

  await payments.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: "paid",
        paid_at: new Date(),
        transfer_reference: reference,
        provider_payload: payload,
        ...touch(),
      },
    }
  );

  await activateShipment(payment.shipment);
  return Response.json({ message: "OK" });
}
