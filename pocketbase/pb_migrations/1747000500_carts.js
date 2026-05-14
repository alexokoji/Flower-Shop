/// <reference path="../pb_data/types.d.ts" />

/**
 * Per-user persistent cart. One row per user (unique on `user`). Items are
 * stored as a JSON array of snapshots — same shape as the frontend's local
 * cart state, so we can swap localStorage for this with no shape changes.
 */
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  const carts = new Collection({
    name: "carts",
    type: "base",
    fields: [
      { name: "user", type: "relation", required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
      { name: "currency", type: "text", max: 3 },
      { name: "coupon_code", type: "text", max: 40 },
      { name: "items", type: "json", maxSize: 65536 },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      'CREATE UNIQUE INDEX `idx_carts_user` ON `carts` (`user`)',
    ],
    listRule:   '@request.auth.id != "" && user = @request.auth.id',
    viewRule:   '@request.auth.id != "" && user = @request.auth.id',
    createRule: '@request.auth.id != "" && user = @request.auth.id',
    updateRule: '@request.auth.id != "" && user = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user = @request.auth.id',
  });
  app.save(carts);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("carts")); } catch (e) {}
});