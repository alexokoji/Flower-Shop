import {
  hmac,
  safeEqualHex,
  alreadyProcessed,
  findOrderByReference,
  markOrderPaid,
} from "@/lib/api/webhooks";

/** POST /api/webhooks/monnify — HMAC-SHA512 over the raw body. */
export async function POST(req: Request) {
  const secret = process.env.MONNIFY_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ message: "Monnify webhook secret not configured." }, { status: 500 });
  }

  const raw = await req.text();
  const provided = (req.headers.get("monnify-signature") ?? "").toLowerCase();
  if (!safeEqualHex(provided, hmac("sha512", raw, secret))) {
    return Response.json({ message: "Invalid signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ message: "Bad JSON." }, { status: 400 });
  }

  const eventType = String(payload.eventType ?? "unknown");
  const data = (payload.eventData ?? payload.data ?? {}) as Record<string, unknown>;
  const ref = String(data.paymentReference ?? data.transactionReference ?? "");
  const eventId = String(data.transactionReference ?? ref);

  if (await alreadyProcessed("monnify", eventId, eventType, payload)) {
    return Response.json({ ok: true, duplicate: true });
  }

  if (eventType === "SUCCESSFUL_TRANSACTION" || data.paymentStatus === "PAID") {
    const order = await findOrderByReference(ref);
    if (order) {
      await markOrderPaid(
        order,
        "monnify",
        ref,
        String(data.transactionReference ?? ""),
        Number(data.amountPaid ?? data.amount ?? order.grand_total),
        String(data.currencyCode ?? data.currency ?? order.currency),
        payload
      );
    }
  }

  return Response.json({ ok: true });
}
