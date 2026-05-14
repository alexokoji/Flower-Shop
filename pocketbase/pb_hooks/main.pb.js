/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase JS hooks (compatible with v0.23+, tested on v0.38).
 *
 * Custom routes:
 *   POST /api/checkout              create an order from a cart (server-validated)
 *   POST /api/shipping/estimate     compute shipping using shipping_rates
 *   POST /api/webhooks/paystack     Paystack signed-payload webhook
 *   POST /api/webhooks/flutterwave  Flutterwave verif-hash webhook
 *   POST /api/webhooks/monnify      Monnify HMAC-SHA512 webhook
 *
 * Secrets are read from environment variables. See pocketbase/.env.example.
 * CORS: PocketBase's built-in CORS allows all origins by default; we don't
 * touch it. Webhooks are server-to-server and don't need CORS at all.
 */

// ---------------------------------------------------------------------------
// helpers (declared inside route handlers because PB Goja sandboxes each file)
// ---------------------------------------------------------------------------

routerAdd("POST", "/api/checkout", (e) => {
  const info = e.requestInfo();
  const body = (info && info.body) || {};

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return e.json(400, { message: "Cart is empty." });

  const currency = (body.currency || "USD").toUpperCase();
  const shipping = body.shipping || {};
  const country = (shipping.country_iso2 || "").toUpperCase();
  const method = shipping.method === "express" ? "express" : "standard";
  if (!country) return e.json(400, { message: "Shipping country is required." });
  if (!shipping.address) return e.json(400, { message: "Shipping address is required." });

  let subtotal = 0;
  let weightKg = 0;
  const lineSnapshots = [];
  for (const line of items) {
    const qty = Math.max(1, parseInt(line.quantity || 1, 10));
    let product;
    try { product = e.app.findRecordById("products", line.product_id); }
    catch (_) { return e.json(404, { message: `Product not found: ${line.product_id}` }); }

    if (product.get("status") === "draft" || product.get("status") === "archived") {
      return e.json(400, { message: `Unavailable: ${product.get("name")}` });
    }
    const restricted = product.get("restricted_countries") || [];
    if (Array.isArray(restricted) && restricted.includes(country)) {
      return e.json(400, { message: `Cannot ship "${product.get("name")}" to ${country}.` });
    }

    const sale = product.get("sale_price");
    const unit = sale > 0 ? sale : product.get("price");
    subtotal += unit * qty;
    weightKg += ((product.get("weight_g") || 0) / 1000) * qty;
    lineSnapshots.push({
      product_id: product.id,
      product_name: product.get("name"),
      product_sku: product.get("sku"),
      product_type: product.get("type"),
      unit_price: unit,
      quantity: qty,
      line_total: unit * qty,
    });
  }

  let shippingFee = 15;
  let deliveryDays = "7-14";
  let rateCurrency = "USD";
  try {
    const rate = e.app.findFirstRecordByFilter(
      "shipping_rates",
      "country_iso2 = {:c} && method = {:m} && is_active = true",
      { c: country, m: method },
    );
    shippingFee = rate.get("base_fee") + (rate.get("per_kg_fee") || 0) * weightKg;
    if (rate.get("min_fee")) shippingFee = Math.max(shippingFee, rate.get("min_fee"));
    if (rate.get("max_fee")) shippingFee = Math.min(shippingFee, rate.get("max_fee"));
    if (rate.get("free_threshold") && subtotal >= rate.get("free_threshold")) shippingFee = 0;
    deliveryDays = rate.get("delivery_days") || deliveryDays;
    rateCurrency = rate.get("currency") || "USD";
  } catch (_) { /* fallback constants used */ }

  let discountTotal = 0;
  let couponId = null;
  let couponSnapshot = null;
  if (body.coupon_code) {
    try {
      const coupon = e.app.findFirstRecordByFilter(
        "coupons",
        "code = {:c} && is_active = true",
        { c: String(body.coupon_code).toUpperCase() },
      );
      const now = new Date();
      const startOk = !coupon.get("starts_at") || new Date(coupon.get("starts_at")) <= now;
      const endOk = !coupon.get("ends_at") || new Date(coupon.get("ends_at")) >= now;
      const minOk = !coupon.get("min_subtotal") || subtotal >= coupon.get("min_subtotal");
      const usageOk = !coupon.get("max_uses") || coupon.get("used_count") < coupon.get("max_uses");
      if (startOk && endOk && minOk && usageOk) {
        if (coupon.get("type") === "fixed") discountTotal = Math.min(coupon.get("value"), subtotal);
        else discountTotal = Math.round(subtotal * (coupon.get("value") / 100) * 100) / 100;
        couponId = coupon.id;
        couponSnapshot = coupon.get("code");
      }
    } catch (_) { /* invalid coupon: silently ignored */ }
  }

  const grand = Math.max(0, subtotal + shippingFee - discountTotal);

  // Generate the order number
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 10; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];

  const ordersCol = e.app.findCollectionByNameOrId("orders");
  const order = new Record(ordersCol);
  order.set("order_number", "FS-" + suffix);

  const auth = info && info.auth;
  if (auth && auth.collectionName === "users") {
    order.set("user", auth.id);
  } else if (body.guest) {
    order.set("guest_email", body.guest.email || "");
    order.set("guest_phone", body.guest.phone || "");
    order.set("guest_first_name", body.guest.first_name || "");
    order.set("guest_last_name", body.guest.last_name || "");
  } else {
    return e.json(401, { message: "Sign in or provide guest details." });
  }

  order.set("currency", currency);
  order.set("subtotal", subtotal);
  order.set("shipping_total", shippingFee);
  order.set("discount_total", discountTotal);
  order.set("tax_total", 0);
  order.set("grand_total", grand);
  if (couponId) {
    order.set("coupon", couponId);
    order.set("coupon_code_snapshot", couponSnapshot);
  }
  order.set("shipping_method", method);
  order.set("shipping_country_iso2", country);
  order.set("shipping_address", shipping.address);
  order.set("billing_address", body.billing || shipping.address);
  order.set("items", lineSnapshots);
  order.set("status", "pending");
  order.set("payment_status", "unpaid");
  if (body.customer_notes) order.set("customer_notes", body.customer_notes);
  order.set("placed_at", new Date().toISOString().replace("T", " ").replace("Z", ""));

  e.app.save(order);

  return e.json(201, {
    order_number: order.get("order_number"),
    id: order.id,
    grand_total: grand,
    currency: currency,
    delivery_days: deliveryDays,
    rate_currency: rateCurrency,
  });
});

// ---------------------------------------------------------------------------
routerAdd("POST", "/api/shipping/estimate", (e) => {
  const info = e.requestInfo();
  const body = (info && info.body) || {};

  const items = Array.isArray(body.items) ? body.items : [];
  const country = (body.country || "").toUpperCase();
  const method = body.method === "express" ? "express" : "standard";
  if (!country) return e.json(400, { message: "country is required" });

  let subtotal = 0;
  let weightKg = 0;
  for (const line of items) {
    let p;
    try { p = e.app.findRecordById("products", line.product_id); } catch (_) { continue; }
    const restricted = p.get("restricted_countries") || [];
    if (Array.isArray(restricted) && restricted.includes(country)) {
      return e.json(200, { eligible: false, reason: `Cannot ship "${p.get("name")}" to ${country}.` });
    }
    const sale = p.get("sale_price");
    const unit = sale > 0 ? sale : p.get("price");
    const q = Math.max(1, parseInt(line.quantity || 1, 10));
    subtotal += unit * q;
    weightKg += ((p.get("weight_g") || 0) / 1000) * q;
  }

  let fee = 15;
  let days = "7-14";
  let currency = "USD";
  try {
    const rate = e.app.findFirstRecordByFilter(
      "shipping_rates",
      "country_iso2 = {:c} && method = {:m} && is_active = true",
      { c: country, m: method },
    );
    fee = rate.get("base_fee") + (rate.get("per_kg_fee") || 0) * weightKg;
    if (rate.get("min_fee")) fee = Math.max(fee, rate.get("min_fee"));
    if (rate.get("max_fee")) fee = Math.min(fee, rate.get("max_fee"));
    if (rate.get("free_threshold") && subtotal >= rate.get("free_threshold")) fee = 0;
    days = rate.get("delivery_days") || days;
    currency = rate.get("currency") || "USD";
  } catch (_) { /* fallback */ }

  return e.json(200, {
    eligible: true,
    method: method, country: country, currency: currency,
    fee: Math.round(fee * 100) / 100,
    delivery_days: days,
    total_weight_kg: Math.round(weightKg * 1000) / 1000,
  });
});

// ---------------------------------------------------------------------------
// Webhook helpers — webhooks must verify the signature against the RAW body.
// We read the raw bytes ourselves so the signature math lines up.
// ---------------------------------------------------------------------------

function readRawBody(e) {
  try { return readerToString(e.request.body); }
  catch (_) {
    // Fallback: requestInfo gives us the parsed object — re-stringify it.
    try {
      const info = e.requestInfo();
      return JSON.stringify(info && info.body ? info.body : {});
    } catch (_2) { return ""; }
  }
}

function recordWebhookEvent(e, provider, eventId, eventType, payload) {
  try {
    const existing = e.app.findFirstRecordByFilter(
      "payment_webhook_events",
      "provider = {:p} && event_id = {:e}",
      { p: provider, e: eventId },
    );
    return { duplicate: true, record: existing };
  } catch (_) { /* not found — create below */ }

  const col = e.app.findCollectionByNameOrId("payment_webhook_events");
  const r = new Record(col);
  r.set("provider", provider);
  r.set("event_id", eventId);
  r.set("event_type", eventType);
  r.set("payload", payload);
  r.set("processed", false);
  e.app.save(r);
  return { duplicate: false, record: r };
}

function markOrderPaid(e, order, provider, ref, txId, amount, currency, raw) {
  order.set("payment_status", "paid");
  order.set("status", "paid");
  order.set("payment_provider", provider);
  if (ref) order.set("payment_reference", ref);
  order.set("paid_at", new Date().toISOString().replace("T", " ").replace("Z", ""));
  e.app.save(order);

  const paymentsCol = e.app.findCollectionByNameOrId("payments");
  const p = new Record(paymentsCol);
  p.set("order", order.id);
  if (order.get("user")) p.set("user", order.get("user"));
  p.set("provider", provider);
  if (ref) p.set("provider_reference", ref);
  if (txId) p.set("provider_transaction_id", txId);
  p.set("currency", currency);
  p.set("amount", amount);
  p.set("status", "succeeded");
  p.set("raw_response", raw);
  p.set("captured_at", new Date().toISOString().replace("T", " ").replace("Z", ""));
  e.app.save(p);
}

function findOrderByReference(e, ref) {
  if (!ref) return null;
  try { return e.app.findFirstRecordByFilter("orders", `payment_reference = "${ref}" || order_number = "${ref}"`); }
  catch (_) { return null; }
}

// ---------------------------------------------------------------------------
routerAdd("POST", "/api/webhooks/paystack", (e) => {
  const secret = $os.getenv("PAYSTACK_SECRET_KEY");
  if (!secret) return e.json(500, { message: "Paystack secret not configured." });

  const raw = readRawBody(e);
  const signature = e.request.header.get("x-paystack-signature");
  const expected = $security.hs512(raw, secret);
  if (!signature || signature !== expected) {
    return e.json(401, { message: "Invalid signature." });
  }

  let payload;
  try { payload = JSON.parse(raw); } catch (_) { return e.json(400, { message: "Bad JSON." }); }

  const eventType = payload.event || "unknown";
  const data = payload.data || {};
  const ref = data.reference || "";
  const eventId = data.id ? String(data.id) : ref;

  const { duplicate } = recordWebhookEvent(e, "paystack", eventId, eventType, payload);
  if (duplicate) return e.json(200, { ok: true, duplicate: true });

  if (eventType === "charge.success") {
    const order = findOrderByReference(e, ref);
    if (order) {
      const amount = (data.amount || 0) / 100;
      const currency = data.currency || order.get("currency");
      markOrderPaid(e, order, "paystack", ref, String(data.id || ""), amount, currency, payload);
    }
  }

  return e.json(200, { ok: true });
});

// ---------------------------------------------------------------------------
routerAdd("POST", "/api/webhooks/flutterwave", (e) => {
  const expected = $os.getenv("FLUTTERWAVE_WEBHOOK_HASH");
  if (!expected) return e.json(500, { message: "Flutterwave hash not configured." });

  const provided = e.request.header.get("verif-hash");
  if (provided !== expected) return e.json(401, { message: "Invalid hash." });

  const raw = readRawBody(e);
  let payload;
  try { payload = JSON.parse(raw); } catch (_) { return e.json(400, { message: "Bad JSON." }); }

  const eventType = payload.event || payload["event.type"] || "unknown";
  const data = payload.data || {};
  const ref = data.tx_ref || "";
  const eventId = data.id ? String(data.id) : ref;

  const { duplicate } = recordWebhookEvent(e, "flutterwave", eventId, eventType, payload);
  if (duplicate) return e.json(200, { ok: true, duplicate: true });

  if (data.status === "successful" || eventType === "charge.completed") {
    const order = findOrderByReference(e, ref);
    if (order && Number(data.amount) >= Number(order.get("grand_total"))) {
      markOrderPaid(e, order, "flutterwave", ref, String(data.id || ""), data.amount, data.currency || order.get("currency"), payload);
    }
  }

  return e.json(200, { ok: true });
});

// ---------------------------------------------------------------------------
routerAdd("POST", "/api/webhooks/monnify", (e) => {
  const secret = $os.getenv("MONNIFY_WEBHOOK_SECRET");
  if (!secret) return e.json(500, { message: "Monnify webhook secret not configured." });

  const raw = readRawBody(e);
  const provided = e.request.header.get("monnify-signature");
  const expected = $security.hs512(raw, secret);
  if (!provided || provided.toLowerCase() !== expected.toLowerCase()) {
    return e.json(401, { message: "Invalid signature." });
  }

  let payload;
  try { payload = JSON.parse(raw); } catch (_) { return e.json(400, { message: "Bad JSON." }); }

  const eventType = payload.eventType || "unknown";
  const data = (payload.eventData || payload.data || {});
  const ref = data.paymentReference || data.transactionReference || "";
  const eventId = data.transactionReference || ref;

  const { duplicate } = recordWebhookEvent(e, "monnify", eventId, eventType, payload);
  if (duplicate) return e.json(200, { ok: true, duplicate: true });

  if (eventType === "SUCCESSFUL_TRANSACTION" || data.paymentStatus === "PAID") {
    const order = findOrderByReference(e, ref);
    if (order) {
      const amount = Number(data.amountPaid || data.amount || order.get("grand_total"));
      const currency = data.currencyCode || data.currency || order.get("currency");
      markOrderPaid(e, order, "monnify", ref, data.transactionReference || "", amount, currency, payload);
    }
  }

  return e.json(200, { ok: true });
});