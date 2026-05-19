/// <reference path="../pb_data/types.d.ts" />

/**
 * Broadens listRule / viewRule on a few collections so users with role=admin
 * can see records that the public listings hide (drafts, inactive, etc.).
 * Mutating rules stay admin-only.
 */
migrate((app) => {
  const adminClause = '@request.auth.role = "admin"';

  function patch(name, listView) {
    let c;
    try { c = app.findCollectionByNameOrId(name); } catch (e) { return; }
    c.listRule = listView;
    c.viewRule = listView;
    app.save(c);
  }

  patch("products",        `(status != "draft" && status != "archived") || ${adminClause}`);
  patch("categories",      `is_active = true || ${adminClause}`);
  patch("coupons",         `is_active = true || ${adminClause}`);
  patch("shipping_rates",  `is_active = true || ${adminClause}`);
}, (app) => {
  // Best-effort revert to the public-only rules.
  function patch(name, listView) {
    let c;
    try { c = app.findCollectionByNameOrId(name); } catch (e) { return; }
    c.listRule = listView;
    c.viewRule = listView;
    app.save(c);
  }
  patch("products",       `status != "draft" && status != "archived"`);
  patch("categories",     `is_active = true`);
  patch("coupons",        `is_active = true`);
  patch("shipping_rates", `is_active = true`);
});