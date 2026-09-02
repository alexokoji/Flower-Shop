import {
  safeEqualStr,
  alreadyProcessed,
  findOrderByReference,
  markOrderPaid,
} from "@/lib/api/webhooks";

/**
 * POST /api/webhooks/flutterwave
 *
 * Flutterwave sends the configured secret verbatim in `verif-hash` rather than
 * a signature over the body, so this compares the shared value in constant time.
 */
export async function POST(req: Request) {
  const expected = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (!expected) {
    return Response.json({ message: "Flutterwave hash not configured." }, { status: 500 });
  }

  const provided = req.headers.get("verif-hash") ?? "";
  if (!safeEqualStr(provided, expected)) {
    return Response.json({ message: "Invalid hash." }, { status: 401 });
  }

  const raw = await req.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ message: "Bad JSON." }, { status: 400 });
  }

  const eventType = String(payload.event ?? payload["event.type"] ?? "unknown");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const ref = String(data.tx_ref ?? "");
  const eventId = data.id ? String(data.id) : ref;

  if (await alreadyProcessed("flutterwave", eventId, eventType, payload)) {
    return Response.json({ ok: true, duplicate: true });
  }

  if (data.status === "successful" || eventType === "charge.completed") {
    const order = await findOrderByReference(ref);
    // Underpayment is not a payment — leave the order unpaid for review.
    if (order && Number(data.amount) >= Number(order.grand_total)) {
      await markOrderPaid(
        order,
        "flutterwave",
        ref,
        String(data.id ?? ""),
        Number(data.amount),
        String(data.currency ?? order.currency),
        payload
      );
    }
  }

  return Response.json({ ok: true });
}
