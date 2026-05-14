/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase v0.23+ no longer auto-adds `created` / `updated` fields to user
 * collections — you have to declare them yourself as `autodate` fields.
 * This migration patches every existing collection by adding both, then
 * touches every record so the values are backfilled.
 */
migrate((app) => {
  const targets = [
    "users", "categories", "products", "addresses", "shipping_rates",
    "coupons", "orders", "shipment_tracking", "reviews", "payments",
    "payment_webhook_events", "wishlists", "notifications",
  ];

  for (const name of targets) {
    let col;
    try { col = app.findCollectionByNameOrId(name); }
    catch (e) { continue; }

    let changed = false;
    if (!col.fields.getByName("created")) {
      col.fields.add(new Field({
        name: "created", type: "autodate", onCreate: true, onUpdate: false,
      }));
      changed = true;
    }
    if (!col.fields.getByName("updated")) {
      col.fields.add(new Field({
        name: "updated", type: "autodate", onCreate: true, onUpdate: true,
      }));
      changed = true;
    }
    if (changed) app.save(col);

    // Backfill: save each record once so the autodate fills in.
    const records = app.findRecordsByFilter(name, "id != ''", "", 0, 0);
    for (const r of records) {
      try { app.save(r); } catch (_) { /* skip rows that fail validation */ }
    }
  }
}, (app) => {
  const targets = [
    "users", "categories", "products", "addresses", "shipping_rates",
    "coupons", "orders", "shipment_tracking", "reviews", "payments",
    "payment_webhook_events", "wishlists", "notifications",
  ];
  for (const name of targets) {
    let col;
    try { col = app.findCollectionByNameOrId(name); } catch (_) { continue; }
    ["created", "updated"].forEach((n) => {
      const f = col.fields.getByName(n);
      if (f) col.fields.removeById(f.id);
    });
    app.save(col);
  }
});