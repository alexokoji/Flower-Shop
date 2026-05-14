/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  const c = new Collection({
    name: "addresses",
    type: "base",
    fields: [
      { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
      { name: "label", type: "text", max: 40 },
      { name: "first_name", type: "text", required: true, max: 60 },
      { name: "last_name", type: "text", required: true, max: 60 },
      { name: "phone", type: "text", max: 32 },
      { name: "country_iso2", type: "text", required: true, max: 2 },
      { name: "state", type: "text", required: true, max: 80 },
      { name: "city", type: "text", required: true, max: 80 },
      { name: "street_address", type: "text", required: true, max: 191 },
      { name: "apartment", type: "text", max: 60 },
      { name: "postal_code", type: "text", max: 24 },
      { name: "landmark", type: "text", max: 120 },
      { name: "is_default_shipping", type: "bool" },
      { name: "is_default_billing", type: "bool" },
    ],
    indexes: [
      "CREATE INDEX idx_addresses_user ON addresses (user)",
    ],
    // Customers see/manage only their own; admins see all.
    listRule: "@request.auth.id != \"\" && (user = @request.auth.id || @request.auth.role = \"admin\")",
    viewRule: "@request.auth.id != \"\" && (user = @request.auth.id || @request.auth.role = \"admin\")",
    createRule: "@request.auth.id != \"\" && user = @request.auth.id",
    updateRule: "@request.auth.id != \"\" && user = @request.auth.id",
    deleteRule: "@request.auth.id != \"\" && user = @request.auth.id",
  });
  app.save(c);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("addresses"));
});
