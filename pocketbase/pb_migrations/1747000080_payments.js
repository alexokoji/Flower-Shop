/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const orders = app.findCollectionByNameOrId("orders");

  const payments = new Collection({
    name: "payments",
    type: "base",
    fields: [
      { name: "order", type: "relation", required: true, collectionId: orders.id, cascadeDelete: true, maxSelect: 1 },
      { name: "user", type: "relation", collectionId: users.id, cascadeDelete: false, maxSelect: 1 },
      { name: "provider", type: "select", required: true, maxSelect: 1,
        values: ["paystack", "flutterwave", "monnify"] },
      { name: "provider_reference", type: "text", max: 160 },
      { name: "provider_transaction_id", type: "text", max: 160 },
      { name: "currency", type: "text", required: true, max: 3 },
      { name: "amount", type: "number", required: true, min: 0 },
      { name: "status", type: "select", required: true, maxSelect: 1,
        values: ["initiated", "pending", "succeeded", "failed", "cancelled", "refunded"] },
      { name: "failure_reason", type: "text", max: 320 },
      { name: "metadata", type: "json", maxSize: 8192 },
      { name: "raw_response", type: "json", maxSize: 32768 },
      { name: "authorized_at", type: "date" },
      { name: "captured_at", type: "date" },
      { name: "refunded_at", type: "date" },
    ],
    indexes: [
      "CREATE INDEX idx_payments_provider_reference ON payments (provider_reference)",
      "CREATE INDEX idx_payments_order ON payments (order)",
      "CREATE INDEX idx_payments_status ON payments (status)",
    ],
    listRule: "@request.auth.id != \"\" && (order.user = @request.auth.id || @request.auth.role = \"admin\")",
    viewRule: "@request.auth.id != \"\" && (order.user = @request.auth.id || @request.auth.role = \"admin\")",
    // Created only by webhook hooks (server-side), not from the browser.
    createRule: null,
    updateRule: "@request.auth.role = \"admin\"",
    deleteRule: "@request.auth.role = \"admin\"",
  });
  app.save(payments);

  const events = new Collection({
    name: "payment_webhook_events",
    type: "base",
    fields: [
      { name: "provider", type: "select", required: true, maxSelect: 1,
        values: ["paystack", "flutterwave", "monnify"] },
      { name: "event_id", type: "text", required: true, max: 160 },
      { name: "event_type", type: "text", required: true, max: 80 },
      { name: "payload", type: "json", maxSize: 65536 },
      { name: "processed", type: "bool" },
      { name: "processing_error", type: "text", max: 2000 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_payment_events_provider_event ON payment_webhook_events (provider, event_id)",
    ],
    listRule: "@request.auth.role = \"admin\"",
    viewRule: "@request.auth.role = \"admin\"",
    createRule: null,
    updateRule: null,
    deleteRule: "@request.auth.role = \"admin\"",
  });
  app.save(events);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("payment_webhook_events"));
  app.delete(app.findCollectionByNameOrId("payments"));
});
