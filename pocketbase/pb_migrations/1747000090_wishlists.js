/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const products = app.findCollectionByNameOrId("products");

  const c = new Collection({
    name: "wishlists",
    type: "base",
    fields: [
      { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
      { name: "product", type: "relation", required: true, collectionId: products.id, cascadeDelete: true, maxSelect: 1 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_wishlists_user_product ON wishlists (user, product)",
      "CREATE INDEX idx_wishlists_user ON wishlists (user)",
    ],
    listRule: "@request.auth.id != \"\" && user = @request.auth.id",
    viewRule: "@request.auth.id != \"\" && user = @request.auth.id",
    createRule: "@request.auth.id != \"\" && user = @request.auth.id",
    updateRule: "@request.auth.id = user",
    deleteRule: "@request.auth.id = user",
  });
  app.save(c);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("wishlists"));
});
