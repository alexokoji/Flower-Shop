/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const products = app.findCollectionByNameOrId("products");
  const orders = app.findCollectionByNameOrId("orders");

  const c = new Collection({
    name: "reviews",
    type: "base",
    fields: [
      { name: "product", type: "relation", required: true, collectionId: products.id, cascadeDelete: true, maxSelect: 1 },
      { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
      { name: "order", type: "relation", collectionId: orders.id, cascadeDelete: false, maxSelect: 1 },
      { name: "rating", type: "number", required: true, min: 1, max: 5 },
      { name: "title", type: "text", max: 160 },
      { name: "body", type: "text", max: 2000 },
      { name: "photos", type: "file", maxSize: 3145728, maxSelect: 4,
        mimeTypes: ["image/jpeg","image/png","image/webp"] },
      { name: "status", type: "select", required: true, maxSelect: 1,
        values: ["pending", "approved", "rejected"] },
      { name: "approved_at", type: "date" },
    ],
    indexes: [
      "CREATE INDEX idx_reviews_product_status ON reviews (product, status)",
      "CREATE UNIQUE INDEX idx_reviews_product_user ON reviews (product, user)",
    ],
    listRule: "status = \"approved\" || @request.auth.id = user || @request.auth.role = \"admin\"",
    viewRule: "status = \"approved\" || @request.auth.id = user || @request.auth.role = \"admin\"",
    createRule: "@request.auth.id != \"\" && @request.auth.id = user",
    updateRule: "(@request.auth.id = user && status = \"pending\") || @request.auth.role = \"admin\"",
    deleteRule: "@request.auth.id = user || @request.auth.role = \"admin\"",
  });
  app.save(c);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("reviews"));
});
