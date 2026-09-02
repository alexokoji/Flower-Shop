import {
  hmac,
  safeEqualHex,
  alreadyProcessed,
  findOrderByReference,
  markOrderPaid,
} from "@/lib/api/webhooks";

/** POST /api/webhooks/paystack — HMAC-SHA512 over the raw body. */
export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return Response.json({ message: "Paystack secret not configured." }, { status: 500 });

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  if (!safeEqualHex(signature, hmac("sha512", raw, secret))) {
    return Response.json({ message: "Invalid signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ message: "Bad JSON." }, { status: 400 });
  }

  const eventType = String(payload.event ?? "unknown");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const reference = String(data.reference ?? "");
  const eventId = data.id ? String(data.id) : reference;

  if (await alreadyProcessed("paystack", eventId, eventType, payload)) {
    return Response.json({ message: "Duplicate ignored." });
  }

  if (eventType !== "charge.success") {
    return Response.json({ message: "Ignored." });
  }

  const order = await findOrderByReference(reference);
  if (!order) return Response.json({ message: "No matching order." });

  // Paystack reports minor units (kobo/cents).
  const amount = Number(data.amount ?? 0) / 100;
  await markOrderPaid(
    order,
    "paystack",
    reference,
    String(data.id ?? ""),
    amount,
    String(data.currency ?? order.currency),
    payload
  );

  return Response.json({ message: "OK" });
}
