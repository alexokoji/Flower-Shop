/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const coupons = app.findCollectionByNameOrId("coupons");

  const orders = new Collection({
    name: "orders",
    type: "base",
    fields: [
      { name: "order_number", type: "text", required: true, max: 40 },
      { name: "user", type: "relation", collectionId: users.id, cascadeDelete: false, maxSelect: 1 },

      // guest snapshot fields
      { name: "guest_email", type: "email" },
      { name: "guest_phone", type: "text", max: 32 },
      { name: "guest_first_name", type: "text", max: 60 },
      { name: "guest_last_name", type: "text", max: 60 },

      // monetary
      { name: "currency", type: "text", required: true, max: 3 },
      { name: "subtotal", type: "number", required: true, min: 0 },
      { name: "shipping_total", type: "number", min: 0 },
      { name: "tax_total", type: "number", min: 0 },
      { name: "discount_total", type: "number", min: 0 },
      { name: "grand_total", type: "number", required: true, min: 0 },

      // coupon
      { name: "coupon", type: "relation", collectionId: coupons.id, cascadeDelete: false, maxSelect: 1 },
      { name: "coupon_code_snapshot", type: "text", max: 40 },

      // shipping
      { name: "shipping_method", type: "select", required: true, maxSelect: 1, values: ["standard", "express"] },
      { name: "shipping_country_iso2", type: "text", required: true, max: 2 },
      { name: "shipping_address", type: "json", maxSize: 2048 },
      { name: "billing_address", type: "json", maxSize: 2048 },

      // line items denormalized into json for guest carts and to keep things simple
      { name: "items", type: "json", maxSize: 32768 },

      // status
      { name: "status", type: "select", required: true, maxSelect: 1,
        values: ["pending","paid","processing","packed","shipped","in_transit","delivered","cancelled","refunded"] },
      { name: "payment_status", type: "select", required: true, maxSelect: 1,
        values: ["unpaid","paid","partially_refunded","refunded","failed"] },
      { name: "payment_provider", type: "select", maxSelect: 1,
        values: ["paystack","flutterwave","monnify"] },
      { name: "payment_reference", type: "text", max: 120 },

      { name: "tracking_id", type: "text", max: 120 },
      { name: "tracking_url", type: "url" },
      { name: "admin_notes", type: "text", max: 2048 },
      { name: "customer_notes", type: "text", max: 2048 },

      { name: "placed_at", type: "date" },
      { name: "paid_at", type: "date" },
      { name: "shipped_at", type: "date" },
      { name: "delivered_at", type: "date" },
      { name: "cancelled_at", type: "date" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_orders_number ON orders (order_number)",
      "CREATE INDEX idx_orders_user ON orders (user)",
      "CREATE INDEX idx_orders_status ON orders (status)",
      "CREATE INDEX idx_orders_payment_status ON orders (payment_status)",
    ],
    // Customers see their own orders; admins see all. Public cannot create orders directly
    // — only the checkout `/api/checkout` custom route (pb_hooks/main.pb.js) creates them.
    listRule: "@request.auth.id != \"\" && (user = @request.auth.id || @request.auth.role = \"admin\")",
    viewRule: "@request.auth.id != \"\" && (user = @request.auth.id || @request.auth.role = \"admin\")",
    createRule: null,
    updateRule: "@request.auth.role = \"admin\"",
    deleteRule: "@request.auth.role = \"admin\"",
  });
  app.save(orders);

  const tracking = new Collection({
    name: "shipment_tracking",
    type: "base",
    fields: [
      { name: "order", type: "relation", required: true, collectionId: orders.id, cascadeDelete: true, maxSelect: 1 },
      { name: "status", type: "text", required: true, max: 40 },
      { name: "location", type: "text", max: 120 },
      { name: "description", type: "text", max: 280 },
      { name: "occurred_at", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX idx_shipment_tracking_order ON shipment_tracking (order, occurred_at)",
    ],
    listRule: "@request.auth.id != \"\" && (order.user = @request.auth.id || @request.auth.role = \"admin\")",
    viewRule: "@request.auth.id != \"\" && (order.user = @request.auth.id || @request.auth.role = \"admin\")",
    createRule: "@request.auth.role = \"admin\"",
    updateRule: "@request.auth.role = \"admin\"",
    deleteRule: "@request.auth.role = \"admin\"",
  });
  app.save(tracking);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("shipment_tracking"));
  app.delete(app.findCollectionByNameOrId("orders"));
});
