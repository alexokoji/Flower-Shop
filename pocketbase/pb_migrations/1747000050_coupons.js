/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const c = new Collection({
    name: "coupons",
    type: "base",
    fields: [
      { name: "code", type: "text", required: true, max: 40 },
      { name: "type", type: "select", required: true, maxSelect: 1, values: ["fixed", "percent"] },
      { name: "value", type: "number", required: true, min: 0 },
      { name: "min_subtotal", type: "number", min: 0 },
      { name: "currency", type: "text", max: 3 },
      { name: "max_uses", type: "number", min: 0 },
      { name: "max_uses_per_user", type: "number", min: 0 },
      { name: "used_count", type: "number", min: 0 },
      { name: "starts_at", type: "date" },
      { name: "ends_at", type: "date" },
      { name: "restrictions", type: "json", maxSize: 4096 },
      { name: "is_active", type: "bool" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_coupons_code ON coupons (code)",
    ],
    // Public can read (for validation at checkout). Only admins write.
    listRule: "is_active = true",
    viewRule: "is_active = true",
    createRule: "@request.auth.role = \"admin\"",
    updateRule: "@request.auth.role = \"admin\"",
    deleteRule: "@request.auth.role = \"admin\"",
  });
  app.save(c);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("coupons"));
});
