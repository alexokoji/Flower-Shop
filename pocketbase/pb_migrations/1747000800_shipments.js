/// <reference path="../pb_data/types.d.ts" />

/**
 * Veloxa Logistics — customer-created shipments.
 *
 * `shipments` is a self-service consignment: the signed-in customer fills in
 * sender / receiver / package details, and a tracking code is generated
 * server-side by pb_hooks/shipments.pb.js (never trusted from the client).
 *
 * `shipment_events` is the append-only tracking timeline. Writing an event is
 * what moves a shipment — the hook mirrors the newest event back onto the
 * parent's `status` / `current_location` so the tracking page reads one row.
 *
 * Public read is deliberately NOT enabled on either collection: the tracking
 * page goes through GET /api/track/:code so a scraper cannot enumerate every
 * customer's sender address.
 */
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  const STATUSES = [
    "draft",
    "pending_pickup",
    "picked_up",
    "in_transit",
    "at_facility",
    "out_for_delivery",
    "delivered",
    "on_hold",
    "exception",
    "returned",
    "cancelled",
  ];

  const shipments = new Collection({
    name: "shipments",
    type: "base",
    fields: [
      { name: "tracking_code", type: "text", required: true, max: 32 },
      { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
      { name: "reference", type: "text", max: 60 },

      // service
      { name: "service_type", type: "select", required: true, maxSelect: 1,
        values: ["same_day", "overnight", "express", "standard", "economy", "freight"] },
      { name: "package_type", type: "select", required: true, maxSelect: 1,
        values: ["parcel", "envelope", "document", "box", "pallet", "crate"] },

      // sender
      { name: "sender_name", type: "text", required: true, max: 120 },
      { name: "sender_company", type: "text", max: 120 },
      { name: "sender_phone", type: "text", required: true, max: 32 },
      { name: "sender_email", type: "email" },
      { name: "sender_address", type: "text", required: true, max: 240 },
      { name: "sender_city", type: "text", required: true, max: 80 },
      { name: "sender_state", type: "text", max: 80 },
      { name: "sender_postal_code", type: "text", max: 24 },
      { name: "sender_country", type: "text", required: true, max: 60 },

      // receiver
      { name: "receiver_name", type: "text", required: true, max: 120 },
      { name: "receiver_company", type: "text", max: 120 },
      { name: "receiver_phone", type: "text", required: true, max: 32 },
      { name: "receiver_email", type: "email" },
      { name: "receiver_address", type: "text", required: true, max: 240 },
      { name: "receiver_city", type: "text", required: true, max: 80 },
      { name: "receiver_state", type: "text", max: 80 },
      { name: "receiver_postal_code", type: "text", max: 24 },
      { name: "receiver_country", type: "text", required: true, max: 60 },

      // package
      { name: "pieces", type: "number", min: 1, max: 999 },
      { name: "weight_kg", type: "number", required: true, min: 0.01 },
      { name: "length_cm", type: "number", min: 0 },
      { name: "width_cm", type: "number", min: 0 },
      { name: "height_cm", type: "number", min: 0 },
      { name: "volumetric_kg", type: "number", min: 0 },
      { name: "chargeable_kg", type: "number", min: 0 },
      { name: "contents", type: "text", required: true, max: 500 },
      { name: "declared_value", type: "number", min: 0 },

      // handling flags
      { name: "fragile", type: "bool" },
      { name: "insured", type: "bool" },
      { name: "signature_required", type: "bool" },
      { name: "is_international", type: "bool" },

      // money
      { name: "currency", type: "text", required: true, max: 3 },
      { name: "shipping_cost", type: "number", min: 0 },
      { name: "insurance_fee", type: "number", min: 0 },
      { name: "tax_total", type: "number", min: 0 },
      { name: "total_cost", type: "number", min: 0 },
      { name: "payment_method", type: "select", maxSelect: 1,
        values: ["prepaid", "collect_on_delivery", "invoice"] },
      { name: "payment_status", type: "select", maxSelect: 1,
        values: ["unpaid", "paid", "refunded"] },

      // state
      { name: "status", type: "select", required: true, maxSelect: 1, values: STATUSES },
      { name: "current_location", type: "text", max: 160 },
      { name: "notes", type: "text", max: 1000 },

      // dates
      { name: "pickup_date", type: "date" },
      { name: "estimated_delivery", type: "date" },
      { name: "shipped_at", type: "date" },
      { name: "delivered_at", type: "date" },

      // receipt sharing — unguessable token so a receipt link can be sent to
      // the receiver without exposing the whole account.
      { name: "public_token", type: "text", max: 40 },

      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      'CREATE UNIQUE INDEX `idx_shipments_tracking_code` ON `shipments` (`tracking_code`)',
      'CREATE INDEX `idx_shipments_user` ON `shipments` (`user`)',
      'CREATE INDEX `idx_shipments_status` ON `shipments` (`status`)',
      'CREATE INDEX `idx_shipments_public_token` ON `shipments` (`public_token`)',
    ],
    listRule:   '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "admin")',
    viewRule:   '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "admin")',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "admin")',
    deleteRule: '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "admin")',
  });
  app.save(shipments);

  const events = new Collection({
    name: "shipment_events",
    type: "base",
    fields: [
      { name: "shipment", type: "relation", required: true, collectionId: shipments.id, cascadeDelete: true, maxSelect: 1 },
      { name: "status", type: "select", required: true, maxSelect: 1, values: STATUSES },
      { name: "location", type: "text", max: 160 },
      { name: "description", type: "text", max: 400 },
      { name: "occurred_at", type: "date", required: true },
      { name: "created_by", type: "relation", collectionId: users.id, cascadeDelete: false, maxSelect: 1 },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    ],
    indexes: [
      'CREATE INDEX `idx_shipment_events_shipment` ON `shipment_events` (`shipment`, `occurred_at`)',
    ],
    listRule:   '@request.auth.id != "" && (shipment.user = @request.auth.id || @request.auth.role = "admin")',
    viewRule:   '@request.auth.id != "" && (shipment.user = @request.auth.id || @request.auth.role = "admin")',
    createRule: '@request.auth.id != "" && (shipment.user = @request.auth.id || @request.auth.role = "admin")',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  });
  app.save(events);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("shipment_events")); } catch (e) {}
  try { app.delete(app.findCollectionByNameOrId("shipments")); } catch (e) {}
});
