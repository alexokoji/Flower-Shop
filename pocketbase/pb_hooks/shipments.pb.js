/// <reference path="../pb_data/types.d.ts" />

/**
 * Veloxa Logistics hooks.
 *
 * Record hooks (shipments / shipment_events):
 *   - generate the tracking code + receipt token server-side
 *   - force `user` to the authenticated caller (no writing shipments for others)
 *   - recompute volumetric / chargeable weight and the price server-side
 *   - append the opening timeline event, and mirror later events onto the parent
 *
 * Custom routes:
 *   GET  /api/track/{code}       public tracking (sanitised — no street addresses)
 *   GET  /api/receipt/{code}     full receipt, needs ?token= from the shipment
 *   POST /api/logistics/quote    price a shipment without creating one
 *
 * Every handler declares its own helpers: PocketBase runs each hook callback in
 * an isolated Goja context, so file-level functions are not visible inside.
 */

// ---------------------------------------------------------------------------
// shipments: normalise + price + code on create
// ---------------------------------------------------------------------------
onRecordCreateRequest((e) => {
  // ---- helpers (inline: isolated Goja context) ----------------------------
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  const randCode = (n) => {
    let out = "";
    const bytes = $security.randomString(n * 2);
    for (let i = 0; i < n; i++) out += ALPHABET[bytes.charCodeAt(i) % ALPHABET.length];
    return out;
  };
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const num = (v, d) => {
    const n = parseFloat(v);
    return isNaN(n) || n < 0 ? d : n;
  };

  const RATES = {
    same_day:  { base: 25, perKg: 4.5, days: 0 },
    overnight: { base: 20, perKg: 3.8, days: 1 },
    express:   { base: 15, perKg: 3.0, days: 2 },
    standard:  { base: 9,  perKg: 1.8, days: 5 },
    economy:   { base: 6,  perKg: 1.2, days: 9 },
    freight:   { base: 40, perKg: 0.9, days: 12 },
  };

  const r = e.record;

  // Ownership is never taken from the client payload — except for a superuser
  // creating a shipment on a customer's behalf from /_/, where `user` is the
  // only thing that could identify the owner.
  const auth = e.auth;
  const isSuperuser = e.hasSuperuserAuth();
  if (!auth && !isSuperuser) throw new BadRequestError("You must be signed in to create a shipment.");
  if (!isSuperuser) r.set("user", auth.id);
  if (!r.get("user")) throw new BadRequestError("A shipment needs an owner.");

  // ---- unique tracking code ---------------------------------------------
  let code = "";
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = "VLX-" + randCode(4) + "-" + randCode(4);
    try {
      e.app.findFirstRecordByFilter("shipments", "tracking_code = {:c}", { c: candidate });
    } catch (_) {
      code = candidate; // not found -> free
      break;
    }
  }
  if (!code) throw new BadRequestError("Could not allocate a tracking code. Please retry.");
  r.set("tracking_code", code);
  r.set("public_token", $security.randomString(32));

  // ---- weights -----------------------------------------------------------
  const pieces = Math.max(1, parseInt(r.get("pieces") || 1, 10));
  const actual = num(r.get("weight_kg"), 0);
  if (actual <= 0) throw new BadRequestError("Package weight is required.");
  const L = num(r.get("length_cm"), 0);
  const W = num(r.get("width_cm"), 0);
  const H = num(r.get("height_cm"), 0);
  const volumetric = round2((L * W * H * pieces) / 5000); // IATA divisor
  const chargeable = round2(Math.max(actual, volumetric));
  r.set("pieces", pieces);
  r.set("volumetric_kg", volumetric);
  r.set("chargeable_kg", chargeable);

  // ---- pricing (server-side; the client's numbers are ignored) ------------
  const svc = RATES[r.get("service_type")] || RATES.standard;
  const from = String(r.get("sender_country") || "").trim().toLowerCase();
  const to = String(r.get("receiver_country") || "").trim().toLowerCase();
  const international = from !== to;
  r.set("is_international", international);

  let shipping = svc.base + svc.perKg * chargeable;
  if (international) shipping *= 1.75;
  if (r.get("fragile")) shipping += 4;
  if (r.get("signature_required")) shipping += 2.5;
  shipping = round2(shipping);

  const declared = num(r.get("declared_value"), 0);
  const insurance = r.get("insured") ? round2(Math.max(3, declared * 0.015)) : 0;
  const tax = round2((shipping + insurance) * 0.075);
  r.set("shipping_cost", shipping);
  r.set("insurance_fee", insurance);
  r.set("tax_total", tax);
  r.set("total_cost", round2(shipping + insurance + tax));
  if (!r.get("currency")) r.set("currency", "USD");
  if (!r.get("payment_method")) r.set("payment_method", "prepaid");
  if (!r.get("payment_status")) r.set("payment_status", "unpaid");

  // ---- dates + opening state --------------------------------------------
  const status = r.get("status") === "draft" ? "draft" : "pending_pickup";
  r.set("status", status);
  if (!r.get("current_location")) {
    const city = r.get("sender_city");
    const country = r.get("sender_country");
    r.set("current_location", [city, country].filter(Boolean).join(", "));
  }
  // Empty date fields come back as a truthy DateTime object, so emptiness
  // must be tested on the string form.
  if (!String(r.get("estimated_delivery") || "")) {
    const days = svc.days + (international ? 3 : 0);
    const eta = new Date(Date.now() + days * 86400000);
    r.set("estimated_delivery", eta.toISOString().replace("T", " ").replace("Z", ""));
  }

  e.next();
}, "shipments");

// ---------------------------------------------------------------------------
// shipments: opening timeline event
// ---------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
  const r = e.record;
  if (r.get("status") === "draft") return e.next();

  try {
    const col = e.app.findCollectionByNameOrId("shipment_events");
    const ev = new Record(col);
    ev.set("shipment", r.id);
    ev.set("status", r.get("status"));
    ev.set("location", r.get("current_location"));
    ev.set("description", "Shipment created. Awaiting pickup by Veloxa.");
    ev.set("occurred_at", new Date().toISOString().replace("T", " ").replace("Z", ""));
    ev.set("created_by", r.get("user"));
    e.app.save(ev);
  } catch (err) {
    e.app.logger().error("veloxa: failed to write opening event", "error", String(err));
  }

  e.next();
}, "shipments");

// ---------------------------------------------------------------------------
// shipment_events: stamp author + time
// ---------------------------------------------------------------------------
onRecordCreateRequest((e) => {
  const r = e.record;
  if (e.auth) r.set("created_by", e.auth.id);
  if (!String(r.get("occurred_at") || "")) {
    r.set("occurred_at", new Date().toISOString().replace("T", " ").replace("Z", ""));
  }
  e.next();
}, "shipment_events");

// ---------------------------------------------------------------------------
// shipment_events: mirror the newest event onto the parent shipment
// ---------------------------------------------------------------------------
onRecordAfterCreateSuccess((e) => {
  const r = e.record;
  try {
    const shipment = e.app.findRecordById("shipments", r.get("shipment"));
    const status = r.get("status");
    shipment.set("status", status);
    if (r.get("location")) shipment.set("current_location", r.get("location"));

    // `occurred_at` comes back as a DateTime value; date fields only accept the
    // string form, so convert before writing it onto the parent.
    const stamp = String(r.get("occurred_at") || "");
    if (status === "picked_up" && !String(shipment.get("shipped_at") || "")) {
      shipment.set("shipped_at", stamp);
    }
    if (status === "delivered") shipment.set("delivered_at", stamp);
    if (status !== "delivered") shipment.set("delivered_at", "");

    e.app.save(shipment);
  } catch (err) {
    e.app.logger().error("veloxa: failed to mirror event onto shipment", "error", String(err));
  }
  e.next();
}, "shipment_events");

// ---------------------------------------------------------------------------
// GET /api/track/{code} — public, sanitised
// ---------------------------------------------------------------------------
routerAdd("GET", "/api/track/{code}", (e) => {
  const raw = e.request.pathValue("code") || "";
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!code || code.length > 32) return e.json(400, { message: "Enter a tracking number." });

  let s;
  try {
    s = e.app.findFirstRecordByFilter("shipments", "tracking_code = {:c}", { c: code });
  } catch (_) {
    return e.json(404, { message: "No shipment found for that tracking number." });
  }
  if (s.get("status") === "draft") {
    return e.json(404, { message: "No shipment found for that tracking number." });
  }

  // Names are partially masked — tracking is public by design.
  const mask = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    return parts.map((p, i) => (i === 0 ? p : p[0].toUpperCase() + ".")).join(" ");
  };
  const place = (city, state, country) => [city, state, country].filter(Boolean).join(", ");

  let events = [];
  try {
    events = e.app.findRecordsByFilter(
      "shipment_events",
      "shipment = {:id}",
      "-occurred_at",
      200,
      0,
      { id: s.id }
    );
  } catch (_) { events = []; }

  return e.json(200, {
    tracking_code: s.get("tracking_code"),
    status: s.get("status"),
    service_type: s.get("service_type"),
    package_type: s.get("package_type"),
    pieces: s.get("pieces"),
    weight_kg: s.get("weight_kg"),
    chargeable_kg: s.get("chargeable_kg"),
    is_international: s.get("is_international"),
    current_location: s.get("current_location"),
    estimated_delivery: s.get("estimated_delivery"),
    shipped_at: s.get("shipped_at"),
    delivered_at: s.get("delivered_at"),
    created: s.get("created"),
    origin: place(s.get("sender_city"), s.get("sender_state"), s.get("sender_country")),
    destination: place(s.get("receiver_city"), s.get("receiver_state"), s.get("receiver_country")),
    sender_name: mask(s.get("sender_name")),
    receiver_name: mask(s.get("receiver_name")),
    events: events.map((ev) => ({
      status: ev.get("status"),
      location: ev.get("location"),
      description: ev.get("description"),
      occurred_at: ev.get("occurred_at"),
    })),
  });
});

// ---------------------------------------------------------------------------
// GET /api/receipt/{code}?token=… — full receipt for sharing
// ---------------------------------------------------------------------------
routerAdd("GET", "/api/receipt/{code}", (e) => {
  const code = String(e.request.pathValue("code") || "").trim().toUpperCase();
  const info = e.requestInfo();
  const token = String((info && info.query && info.query.token) || "").trim();
  if (!code || !token) return e.json(400, { message: "Missing tracking code or token." });

  let s;
  try {
    s = e.app.findFirstRecordByFilter("shipments", "tracking_code = {:c}", { c: code });
  } catch (_) {
    return e.json(404, { message: "Receipt not found." });
  }

  const expected = String(s.get("public_token") || "");
  // Constant-length compare to avoid leaking the token through timing.
  if (!expected || expected.length !== token.length) return e.json(404, { message: "Receipt not found." });
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  if (diff !== 0) return e.json(404, { message: "Receipt not found." });

  const out = {};
  const keys = [
    "tracking_code", "reference", "status", "service_type", "package_type", "pieces",
    "weight_kg", "volumetric_kg", "chargeable_kg", "contents", "declared_value",
    "fragile", "insured", "signature_required", "is_international",
    "currency", "shipping_cost", "insurance_fee", "tax_total", "total_cost",
    "payment_method", "payment_status", "current_location", "notes",
    "pickup_date", "estimated_delivery", "shipped_at", "delivered_at", "created",
    "sender_name", "sender_company", "sender_phone", "sender_email", "sender_address",
    "sender_city", "sender_state", "sender_postal_code", "sender_country",
    "receiver_name", "receiver_company", "receiver_phone", "receiver_email", "receiver_address",
    "receiver_city", "receiver_state", "receiver_postal_code", "receiver_country",
  ];
  for (const k of keys) out[k] = s.get(k);

  return e.json(200, out);
});

// ---------------------------------------------------------------------------
// POST /api/logistics/quote — price without creating
// ---------------------------------------------------------------------------
routerAdd("POST", "/api/logistics/quote", (e) => {
  const RATES = {
    same_day:  { base: 25, perKg: 4.5, days: 0 },
    overnight: { base: 20, perKg: 3.8, days: 1 },
    express:   { base: 15, perKg: 3.0, days: 2 },
    standard:  { base: 9,  perKg: 1.8, days: 5 },
    economy:   { base: 6,  perKg: 1.2, days: 9 },
    freight:   { base: 40, perKg: 0.9, days: 12 },
  };
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const num = (v, d) => {
    const n = parseFloat(v);
    return isNaN(n) || n < 0 ? d : n;
  };

  const info = e.requestInfo();
  const b = (info && info.body) || {};

  const pieces = Math.max(1, parseInt(b.pieces || 1, 10));
  const actual = num(b.weight_kg, 0);
  if (actual <= 0) return e.json(400, { message: "Enter a package weight." });

  const volumetric = round2((num(b.length_cm, 0) * num(b.width_cm, 0) * num(b.height_cm, 0) * pieces) / 5000);
  const chargeable = round2(Math.max(actual, volumetric));

  const svc = RATES[b.service_type] || RATES.standard;
  const international =
    String(b.sender_country || "").trim().toLowerCase() !==
    String(b.receiver_country || "").trim().toLowerCase();

  let shipping = svc.base + svc.perKg * chargeable;
  if (international) shipping *= 1.75;
  if (b.fragile) shipping += 4;
  if (b.signature_required) shipping += 2.5;
  shipping = round2(shipping);

  const insurance = b.insured ? round2(Math.max(3, num(b.declared_value, 0) * 0.015)) : 0;
  const tax = round2((shipping + insurance) * 0.075);
  const days = svc.days + (international ? 3 : 0);

  return e.json(200, {
    currency: (b.currency || "USD").toUpperCase(),
    volumetric_kg: volumetric,
    chargeable_kg: chargeable,
    is_international: international,
    shipping_cost: shipping,
    insurance_fee: insurance,
    tax_total: tax,
    total_cost: round2(shipping + insurance + tax),
    transit_days: days,
    estimated_delivery: new Date(Date.now() + days * 86400000).toISOString(),
  });
});
