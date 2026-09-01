/// <reference path="../pb_data/types.d.ts" />

/**
 * Veloxa shipment payments.
 *
 * A shipment is created as a `draft` and only becomes publicly trackable once
 * its payment reaches `paid`. Activation lives in ONE place — the
 * shipment_payments update hook — so every path (webhook, admin confirmation)
 * activates identically.
 *
 * Routes:
 *   GET  /api/logistics/payment-methods   customer-safe view of the admin config
 *   POST /api/logistics/pay               start a payment for a draft shipment
 *   POST /api/logistics/pay/declare       customer declares a completed transfer
 *   POST /api/webhooks/paymentpoint       PaymentPoint settlement notification
 *
 * Credentials are read from `logistics_settings` (admin-only collection), with
 * env vars as an override for deployments that keep secrets out of the DB.
 */

// ---------------------------------------------------------------------------
// GET /api/logistics/payment-methods
// ---------------------------------------------------------------------------
routerAdd("GET", "/api/logistics/payment-methods", (e) => {
  if (!e.auth) return e.json(401, { message: "Sign in to view payment options." });

  let s = null;
  try { s = e.app.findFirstRecordByFilter("logistics_settings", "key = 'default'"); } catch (_) {}
  if (!s) return e.json(200, { bank_transfer: null, paymentpoint: { enabled: false } });

  const bankEnabled = !!s.get("bank_transfer_enabled") && !!s.get("bank_account_number");
  const ppEnabled =
    !!s.get("paymentpoint_enabled") &&
    !!($os.getenv("PAYMENTPOINT_API_KEY") || s.get("paymentpoint_api_key"));

  return e.json(200, {
    currency: s.get("payment_currency") || "NGN",
    support_email: s.get("support_email") || "",
    support_phone: s.get("support_phone") || "",
    // Never leak API/secret keys — only what the customer must see to pay.
    bank_transfer: bankEnabled
      ? {
          enabled: true,
          bank_name: s.get("bank_name"),
          account_name: s.get("bank_account_name"),
          account_number: s.get("bank_account_number"),
          branch: s.get("bank_branch"),
          swift: s.get("bank_swift"),
          instructions: s.get("bank_instructions"),
        }
      : { enabled: false },
    paymentpoint: { enabled: ppEnabled },
  });
});

// ---------------------------------------------------------------------------
// POST /api/logistics/pay  { shipment_id, method }
// ---------------------------------------------------------------------------
routerAdd("POST", "/api/logistics/pay", (e) => {
  if (!e.auth) return e.json(401, { message: "Sign in to pay for a shipment." });

  const info = e.requestInfo();
  const b = (info && info.body) || {};
  const shipmentId = String(b.shipment_id || "");
  const method = b.method === "paymentpoint" ? "paymentpoint" : "bank_transfer";
  if (!shipmentId) return e.json(400, { message: "Missing shipment." });

  let shipment;
  try { shipment = e.app.findRecordById("shipments", shipmentId); }
  catch (_) { return e.json(404, { message: "Shipment not found." }); }

  const isAdmin = e.auth.get("role") === "admin";
  if (shipment.get("user") !== e.auth.id && !isAdmin) {
    return e.json(403, { message: "That shipment is not yours." });
  }
  if (shipment.get("payment_status") === "paid") {
    return e.json(400, { message: "This shipment is already paid for." });
  }

  let settings = null;
  try { settings = e.app.findFirstRecordByFilter("logistics_settings", "key = 'default'"); } catch (_) {}
  if (!settings) return e.json(503, { message: "Payments are not configured yet." });

  const amount = shipment.get("total_cost") || 0;
  const currency = shipment.get("currency") || settings.get("payment_currency") || "NGN";

  // Reuse the open payment row for this shipment+method rather than piling up
  // abandoned attempts.
  let payment = null;
  try {
    payment = e.app.findFirstRecordByFilter(
      "shipment_payments",
      "shipment = {:s} && method = {:m} && (status = 'pending' || status = 'awaiting_confirmation')",
      { s: shipment.id, m: method }
    );
  } catch (_) {}

  if (!payment) {
    const col = e.app.findCollectionByNameOrId("shipment_payments");
    payment = new Record(col);
    payment.set("shipment", shipment.id);
    payment.set("user", shipment.get("user"));
    payment.set("method", method);
    payment.set("status", "pending");
    payment.set("amount", amount);
    payment.set("currency", currency);
    payment.set("reference", shipment.get("tracking_code"));
  } else {
    payment.set("amount", amount);
    payment.set("currency", currency);
  }

  // ---- bank transfer: hand back the company account ----------------------
  if (method === "bank_transfer") {
    if (!settings.get("bank_transfer_enabled") || !settings.get("bank_account_number")) {
      return e.json(503, { message: "Bank transfer is unavailable right now." });
    }
    e.app.save(payment);
    return e.json(200, {
      payment_id: payment.id,
      method: "bank_transfer",
      status: payment.get("status"),
      amount: amount,
      currency: currency,
      reference: payment.get("reference"),
      bank: {
        bank_name: settings.get("bank_name"),
        account_name: settings.get("bank_account_name"),
        account_number: settings.get("bank_account_number"),
        branch: settings.get("bank_branch"),
        swift: settings.get("bank_swift"),
        instructions: settings.get("bank_instructions"),
      },
    });
  }

  // ---- PaymentPoint: request a dynamic virtual account -------------------
  const apiKey = $os.getenv("PAYMENTPOINT_API_KEY") || settings.get("paymentpoint_api_key");
  const businessId = $os.getenv("PAYMENTPOINT_BUSINESS_ID") || settings.get("paymentpoint_business_id");
  const baseUrl = (settings.get("paymentpoint_base_url") || "https://api.paymentpoint.co/api/v1").replace(/\/+$/, "");
  if (!settings.get("paymentpoint_enabled") || !apiKey || !businessId) {
    return e.json(503, { message: "PaymentPoint is unavailable right now." });
  }

  // Reuse an account we already issued for this payment.
  if (payment.id && payment.get("virtual_account_number")) {
    return e.json(200, {
      payment_id: payment.id,
      method: "paymentpoint",
      status: payment.get("status"),
      amount: amount,
      currency: currency,
      reference: payment.get("reference"),
      virtual_account: {
        bank_name: payment.get("virtual_account_bank"),
        account_name: payment.get("virtual_account_name"),
        account_number: payment.get("virtual_account_number"),
      },
    });
  }

  const payerEmail = shipment.get("sender_email") || e.auth.get("email") || "";
  const body = {
    email: payerEmail,
    name: shipment.get("sender_name") || "Veloxa customer",
    phone: shipment.get("sender_phone") || "",
    businessid: businessId,
    amount: amount,
    currency: currency,
    reference: payment.get("reference"),
  };
  const bankCode = settings.get("paymentpoint_bank_code");
  if (bankCode) body.bankcode = [bankCode];

  let res;
  try {
    res = $http.send({
      url: baseUrl + "/createVirtualAccount",
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
        "api-key": apiKey,
        "businessid": businessId,
      },
      timeout: 30,
    });
  } catch (err) {
    e.app.logger().error("paymentpoint: request failed", "error", String(err));
    return e.json(502, { message: "Could not reach PaymentPoint. Try bank transfer." });
  }

  if (res.statusCode < 200 || res.statusCode >= 300) {
    e.app.logger().error("paymentpoint: bad status", "status", res.statusCode, "body", String(res.raw));
    return e.json(502, { message: "PaymentPoint rejected the request. Try bank transfer." });
  }

  const data = res.json || {};
  // The payload nests the account under different keys across API versions —
  // accept the common shapes rather than hard-failing on one.
  const acct =
    (Array.isArray(data.bankAccounts) && data.bankAccounts[0]) ||
    (Array.isArray(data.bank_accounts) && data.bank_accounts[0]) ||
    data.account ||
    data.data ||
    data;

  const accountNumber = acct.accountNumber || acct.account_number || "";
  if (!accountNumber) {
    e.app.logger().error("paymentpoint: no account in response", "body", String(res.raw));
    return e.json(502, { message: "PaymentPoint returned no account. Try bank transfer." });
  }

  payment.set("virtual_account_bank", acct.bankName || acct.bank_name || "");
  payment.set("virtual_account_name", acct.accountName || acct.account_name || "");
  payment.set("virtual_account_number", accountNumber);
  payment.set("provider_payload", data);
  e.app.save(payment);

  return e.json(200, {
    payment_id: payment.id,
    method: "paymentpoint",
    status: payment.get("status"),
    amount: amount,
    currency: currency,
    reference: payment.get("reference"),
    virtual_account: {
      bank_name: payment.get("virtual_account_bank"),
      account_name: payment.get("virtual_account_name"),
      account_number: payment.get("virtual_account_number"),
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/logistics/pay/declare  { payment_id, payer_name, bank, transfer_reference }
// The customer states they have paid. This never marks the payment `paid` —
// only an admin (or the PaymentPoint webhook) can do that.
// ---------------------------------------------------------------------------
routerAdd("POST", "/api/logistics/pay/declare", (e) => {
  if (!e.auth) return e.json(401, { message: "Sign in first." });

  const info = e.requestInfo();
  const b = (info && info.body) || {};
  let payment;
  try { payment = e.app.findRecordById("shipment_payments", String(b.payment_id || "")); }
  catch (_) { return e.json(404, { message: "Payment not found." }); }

  if (payment.get("user") !== e.auth.id && e.auth.get("role") !== "admin") {
    return e.json(403, { message: "That payment is not yours." });
  }
  if (payment.get("status") === "paid") {
    return e.json(400, { message: "This payment is already confirmed." });
  }

  payment.set("payer_name", String(b.payer_name || "").substring(0, 120));
  payment.set("paid_from_bank", String(b.bank || "").substring(0, 120));
  payment.set("transfer_reference", String(b.transfer_reference || "").substring(0, 120));
  payment.set("status", "awaiting_confirmation");
  e.app.save(payment);

  return e.json(200, { payment_id: payment.id, status: payment.get("status") });
});

// ---------------------------------------------------------------------------
// POST /api/webhooks/paymentpoint
// ---------------------------------------------------------------------------
routerAdd("POST", "/api/webhooks/paymentpoint", (e) => {
  let settings = null;
  try { settings = e.app.findFirstRecordByFilter("logistics_settings", "key = 'default'"); } catch (_) {}
  const secret = $os.getenv("PAYMENTPOINT_SECRET_KEY") || (settings && settings.get("paymentpoint_secret_key"));
  if (!secret) return e.json(500, { message: "PaymentPoint secret not configured." });

  let raw = "";
  try { raw = readerToString(e.request.body); }
  catch (_) {
    try { raw = JSON.stringify((e.requestInfo() || {}).body || {}); } catch (_2) { raw = ""; }
  }

  const signature =
    e.request.header.get("paymentpoint-signature") ||
    e.request.header.get("x-paymentpoint-signature") ||
    "";
  const expected = $security.hs256(raw, secret);
  if (!signature || signature.toLowerCase() !== expected.toLowerCase()) {
    return e.json(401, { message: "Invalid signature." });
  }

  let payload;
  try { payload = JSON.parse(raw); } catch (_) { return e.json(400, { message: "Bad JSON." }); }

  const tx = payload.transaction || payload.data || payload;
  const status = String(tx.transaction_status || tx.status || payload.notification_status || "").toLowerCase();
  const accountNumber = String(
    (tx.receiver && (tx.receiver.account_number || tx.receiver.accountNumber)) ||
    tx.account_number || tx.accountNumber || ""
  );
  const reference = String(tx.transaction_id || tx.reference || tx.settlement_id || "");
  const amount = parseFloat(tx.amount_paid || tx.amount || tx.settlement_amount || 0) || 0;

  // Log every delivery so replays are visible and idempotent.
  const eventId = reference || (accountNumber + ":" + amount);
  try {
    e.app.findFirstRecordByFilter(
      "payment_webhook_events",
      "provider = 'paymentpoint' && event_id = {:e}",
      { e: eventId }
    );
    return e.json(200, { message: "Duplicate ignored." });
  } catch (_) {
    try {
      const col = e.app.findCollectionByNameOrId("payment_webhook_events");
      const ev = new Record(col);
      ev.set("provider", "paymentpoint");
      ev.set("event_id", eventId);
      ev.set("event_type", status || "notification");
      ev.set("payload", payload);
      ev.set("processed", false);
      e.app.save(ev);
    } catch (err) {
      e.app.logger().error("paymentpoint: could not log event", "error", String(err));
    }
  }

  const successful = status === "success" || status === "successful" || status === "paid" || status === "completed";
  if (!successful) return e.json(200, { message: "Ignored non-success notification." });

  let payment = null;
  if (accountNumber) {
    try {
      payment = e.app.findFirstRecordByFilter(
        "shipment_payments",
        "virtual_account_number = {:a} && status != 'paid'",
        { a: accountNumber }
      );
    } catch (_) {}
  }
  if (!payment && reference) {
    try {
      payment = e.app.findFirstRecordByFilter(
        "shipment_payments",
        "reference = {:r} && status != 'paid'",
        { r: reference }
      );
    } catch (_) {}
  }
  if (!payment) return e.json(200, { message: "No matching payment." });

  // Underpayment stays pending — an admin decides what to do with it.
  const due = payment.get("amount") || 0;
  if (amount > 0 && amount + 0.01 < due) {
    payment.set("admin_note", "Underpaid: received " + amount + " of " + due);
    payment.set("status", "awaiting_confirmation");
    payment.set("provider_payload", payload);
    e.app.save(payment);
    return e.json(200, { message: "Underpayment flagged." });
  }

  payment.set("status", "paid");
  payment.set("paid_at", new Date().toISOString().replace("T", " ").replace("Z", ""));
  payment.set("transfer_reference", reference);
  payment.set("provider_payload", payload);
  e.app.save(payment); // the update hook below activates the shipment

  return e.json(200, { message: "OK" });
});

// ---------------------------------------------------------------------------
// shipment_payments -> paid : activate the shipment (single source of truth)
// ---------------------------------------------------------------------------
onRecordAfterUpdateSuccess((e) => {
  const p = e.record;
  if (p.get("status") !== "paid") return e.next();

  try {
    const shipment = e.app.findRecordById("shipments", p.get("shipment"));
    if (shipment.get("payment_status") === "paid") return e.next(); // already live

    shipment.set("payment_status", "paid");
    if (!String(p.get("paid_at") || "")) p.set("paid_at", new Date().toISOString().replace("T", " ").replace("Z", ""));

    if (shipment.get("status") === "draft") {
      shipment.set("status", "pending_pickup");
      if (!shipment.get("current_location")) {
        shipment.set(
          "current_location",
          [shipment.get("sender_city"), shipment.get("sender_country")].filter(Boolean).join(", ")
        );
      }
    }
    e.app.save(shipment);

    // Opening timeline event — the shipment is only now publicly trackable.
    const hasEvents = e.app.findRecordsByFilter("shipment_events", "shipment = {:s}", "-occurred_at", 1, 0, { s: shipment.id });
    if (!hasEvents.length) {
      const col = e.app.findCollectionByNameOrId("shipment_events");
      const ev = new Record(col);
      ev.set("shipment", shipment.id);
      ev.set("status", shipment.get("status"));
      ev.set("location", shipment.get("current_location"));
      ev.set("description", "Payment received. Shipment booked and awaiting pickup by Veloxa.");
      ev.set("occurred_at", new Date().toISOString().replace("T", " ").replace("Z", ""));
      ev.set("created_by", shipment.get("user"));
      e.app.save(ev);
    }
  } catch (err) {
    e.app.logger().error("veloxa: failed to activate shipment after payment", "error", String(err));
  }

  e.next();
}, "shipment_payments");

// ---------------------------------------------------------------------------
// Customers may attach proof to their own unpaid payment, but nothing else:
// status, money and the admin note are restored from the stored row.
// ---------------------------------------------------------------------------
onRecordUpdateRequest((e) => {
  // A PocketBase superuser editing from /_/ counts as staff, not a customer.
  const isAdmin = e.hasSuperuserAuth() || (e.auth && e.auth.get("role") === "admin");
  if (isAdmin) {
    // Stamp the settlement time when staff confirm, so the receipt has a date
    // even if the admin UI did not send one.
    if (e.record.get("status") === "paid" && !String(e.record.get("paid_at") || "")) {
      e.record.set("paid_at", new Date().toISOString().replace("T", " ").replace("Z", ""));
    }
    return e.next();
  }

  const r = e.record;
  let original;
  try { original = e.app.findRecordById("shipment_payments", r.id); }
  catch (_) { throw new BadRequestError("Payment not found."); }

  if (original.get("status") === "paid") {
    throw new BadRequestError("This payment is already confirmed.");
  }

  for (const field of ["status", "amount", "currency", "paid_at", "admin_note", "user", "shipment", "method", "reference", "provider_payload", "virtual_account_number", "virtual_account_bank", "virtual_account_name"]) {
    r.set(field, original.get(field));
  }
  e.next();
}, "shipment_payments");

// ---------------------------------------------------------------------------
// Customers may not self-approve: force safe values on customer-created rows.
// ---------------------------------------------------------------------------
onRecordCreateRequest((e) => {
  const r = e.record;
  const isAdmin = e.hasSuperuserAuth() || (e.auth && e.auth.get("role") === "admin");
  if (!isAdmin) {
    r.set("status", "pending");
    r.set("paid_at", "");
    r.set("admin_note", "");
    if (e.auth) r.set("user", e.auth.id);

    // Amount and currency always come from the shipment, never the client.
    try {
      const shipment = e.app.findRecordById("shipments", r.get("shipment"));
      r.set("amount", shipment.get("total_cost") || 0);
      r.set("currency", shipment.get("currency") || "USD");
      if (!r.get("reference")) r.set("reference", shipment.get("tracking_code"));
    } catch (_) {
      throw new BadRequestError("Shipment not found.");
    }
  }
  e.next();
}, "shipment_payments");
