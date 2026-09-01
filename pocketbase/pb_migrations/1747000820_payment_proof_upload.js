/// <reference path="../pb_data/types.d.ts" />

/**
 * Let a customer attach proof of a bank transfer to their own unpaid payment.
 *
 * The rule only opens rows that are still `pending` / `awaiting_confirmation`,
 * and pb_hooks/logistics_payments.pb.js rejects any non-admin attempt to change
 * status, amount, currency or the admin note — so this cannot be used to
 * self-approve a shipment.
 */
migrate((app) => {
  const c = app.findCollectionByNameOrId("shipment_payments");
  c.updateRule =
    '@request.auth.role = "admin" || ' +
    '(@request.auth.id != "" && user = @request.auth.id && (status = "pending" || status = "awaiting_confirmation"))';
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("shipment_payments");
  c.updateRule = '@request.auth.role = "admin"';
  app.save(c);
});
