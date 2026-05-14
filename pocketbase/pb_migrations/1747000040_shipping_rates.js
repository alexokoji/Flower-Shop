/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const c = new Collection({
    name: "shipping_rates",
    type: "base",
    fields: [
      { name: "country_iso2", type: "text", required: true, max: 2 },
      { name: "method", type: "select", required: true, maxSelect: 1, values: ["standard", "express"] },
      { name: "currency", type: "text", required: true, max: 3 },
      { name: "base_fee", type: "number", required: true, min: 0 },
      { name: "per_kg_fee", type: "number", min: 0 },
      { name: "min_fee", type: "number", min: 0 },
      { name: "max_fee", type: "number", min: 0 },
      { name: "free_threshold", type: "number", min: 0 },
      { name: "delivery_days", type: "text", max: 20 },
      { name: "is_active", type: "bool" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_shipping_rates_country_method ON shipping_rates (country_iso2, method)",
    ],
    listRule: "is_active = true",
    viewRule: "is_active = true",
    createRule: "@request.auth.role = \"admin\"",
    updateRule: "@request.auth.role = \"admin\"",
    deleteRule: "@request.auth.role = \"admin\"",
  });
  app.save(c);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("shipping_rates"));
});
