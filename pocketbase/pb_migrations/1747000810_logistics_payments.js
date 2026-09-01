/// <reference path="../pb_data/types.d.ts" />

/**
 * Payment for customer-created shipments.
 *
 * A shipment is created as a `draft` and is NOT publicly trackable until it is
 * paid for. Two methods are supported, both configured by an admin:
 *
 *   paymentpoint    — dynamic virtual account / transfer, confirmed by webhook
 *   bank_transfer   — customer pays into the company account and uploads proof,
 *                     an admin confirms it manually
 *
 * `logistics_settings` is a single-row config collection. It holds secrets
 * (PaymentPoint API + secret key), so it is readable ONLY by admins — the
 * customer-facing subset is served by GET /api/logistics/payment-methods.
 */
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const shipments = app.findCollectionByNameOrId("shipments");

  const settings = new Collection({
    name: "logistics_settings",
    type: "base",
    fields: [
      { name: "key", type: "text", required: true, max: 40 }, // always "default"

      // --- bank transfer -----------------------------------------------
      { name: "bank_transfer_enabled", type: "bool" },
      { name: "bank_name", type: "text", max: 120 },
      { name: "bank_account_name", type: "text", max: 120 },
      { name: "bank_account_number", type: "text", max: 40 },
      { name: "bank_branch", type: "text", max: 120 },
      { name: "bank_swift", type: "text", max: 40 },
      { name: "bank_instructions", type: "text", max: 1000 },

      // --- paymentpoint -------------------------------------------------
      { name: "paymentpoint_enabled", type: "bool" },
      { name: "paymentpoint_business_id", type: "text", max: 120 },
      { name: "paymentpoint_api_key", type: "text", max: 200 },
      { name: "paymentpoint_secret_key", type: "text", max: 200 },
      { name: "paymentpoint_base_url", type: "url" },
      { name: "paymentpoint_bank_code", type: "text", max: 40 },

      // --- general ------------------------------------------------------
      { name: "payment_currency", type: "text", max: 3 },
      { name: "support_email", type: "email" },
      { name: "support_phone", type: "text", max: 32 },

      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      'CREATE UNIQUE INDEX `idx_logistics_settings_key` ON `logistics_settings` (`key`)',
    ],
    // Secrets live here — admins only, in every direction.
    listRule:   '@request.auth.role = "admin"',
    viewRule:   '@request.auth.role = "admin"',
    createRule: '@request.auth.role = "admin"',
    updateRule: '@request.auth.role = "admin"',
    deleteRule: null,
  });
  app.save(settings);

  const seed = new Record(settings);
  seed.set("key", "default");
  seed.set("bank_transfer_enabled", true);
  seed.set("bank_name", "");
  seed.set("bank_account_name", "");
  seed.set("bank_account_number", "");
  seed.set("bank_instructions", "Use your shipment tracking code as the transfer narration.");
  seed.set("paymentpoint_enabled", false);
  seed.set("paymentpoint_base_url", "https://api.paymentpoint.co/api/v1");
  seed.set("paymentpoint_bank_code", "");
  seed.set("payment_currency", "NGN");
  app.save(seed);

  const payments = new Collection({
    name: "shipment_payments",
    type: "base",
    fields: [
      { name: "shipment", type: "relation", required: true, collectionId: shipments.id, cascadeDelete: true, maxSelect: 1 },
      { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: false, maxSelect: 1 },
      { name: "method", type: "select", required: true, maxSelect: 1, values: ["paymentpoint", "bank_transfer"] },
      { name: "status", type: "select", required: true, maxSelect: 1,
        values: ["pending", "awaiting_confirmation", "paid", "failed", "cancelled"] },
      { name: "amount", type: "number", required: true, min: 0 },
      { name: "currency", type: "text", required: true, max: 3 },
      { name: "reference", type: "text", max: 120 },

      // bank transfer evidence supplied by the customer
      { name: "payer_name", type: "text", max: 120 },
      { name: "paid_from_bank", type: "text", max: 120 },
      { name: "transfer_reference", type: "text", max: 120 },
      { name: "proof", type: "file", maxSelect: 1, maxSize: 5242880,
        mimeTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"] },

      // provider-issued virtual account (PaymentPoint)
      { name: "virtual_account_bank", type: "text", max: 120 },
      { name: "virtual_account_name", type: "text", max: 120 },
      { name: "virtual_account_number", type: "text", max: 40 },
      { name: "provider_payload", type: "json", maxSize: 16384 },

      { name: "admin_note", type: "text", max: 500 },
      { name: "paid_at", type: "date" },

      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      'CREATE INDEX `idx_shipment_payments_shipment` ON `shipment_payments` (`shipment`)',
      'CREATE INDEX `idx_shipment_payments_status` ON `shipment_payments` (`status`)',
      'CREATE INDEX `idx_shipment_payments_reference` ON `shipment_payments` (`reference`)',
    ],
    listRule:   '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "admin")',
    viewRule:   '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "admin")',
    // Customers may declare a bank transfer; `status` is forced by the hook so
    // nobody can self-approve. PaymentPoint rows are created server-side.
    createRule: '@request.auth.id != "" && user = @request.auth.id && shipment.user = @request.auth.id',
    // Only admins move a payment to paid — the customer can attach proof while
    // it is still awaiting confirmation.
    updateRule: '@request.auth.role = "admin"',
    deleteRule: '@request.auth.role = "admin"',
  });
  app.save(payments);

  // PaymentPoint notifications land in the shared webhook log.
  const webhookEvents = app.findCollectionByNameOrId("payment_webhook_events");
  const providerField = webhookEvents.fields.getByName("provider");
  if (providerField && providerField.values.indexOf("paymentpoint") === -1) {
    providerField.values = providerField.values.concat(["paymentpoint"]);
    app.save(webhookEvents);
  }
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("shipment_payments")); } catch (e) {}
  try { app.delete(app.findCollectionByNameOrId("logistics_settings")); } catch (e) {}
});
