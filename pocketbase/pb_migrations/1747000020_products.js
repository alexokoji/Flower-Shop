/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const categories = app.findCollectionByNameOrId("categories");

  const c = new Collection({
    name: "products",
    type: "base",
    fields: [
      { name: "category", type: "relation", required: true, collectionId: categories.id, cascadeDelete: false, maxSelect: 1 },
      { name: "type", type: "select", required: true, maxSelect: 1, values: ["flower", "necklace"] },
      { name: "name", type: "text", required: true, max: 160 },
      { name: "slug", type: "text", required: true, max: 200 },
      { name: "sku", type: "text", required: true, max: 64 },
      { name: "short_description", type: "text", max: 280 },
      { name: "description", type: "editor" },

      { name: "currency", type: "text", max: 3 },
      { name: "price", type: "number", required: true, min: 0 },
      { name: "sale_price", type: "number", min: 0 },

      { name: "stock_quantity", type: "number", min: 0 },
      { name: "low_stock_threshold", type: "number", min: 0 },
      { name: "status", type: "select", required: true, maxSelect: 1,
        values: ["in_stock", "out_of_stock", "preorder", "draft", "archived"] },

      { name: "is_featured", type: "bool" },
      { name: "is_best_seller", type: "bool" },

      // type-specific bag of properties
      { name: "attributes", type: "json", maxSize: 8192 },

      // images
      { name: "images", type: "file", maxSize: 5242880, maxSelect: 10,
        mimeTypes: ["image/jpeg","image/png","image/webp","image/avif"] },

      // shipping
      { name: "weight_g", type: "number", min: 0 },
      { name: "ships_internationally", type: "bool" },
      { name: "restricted_countries", type: "json", maxSize: 1024 },
      { name: "delivery_estimate", type: "text", max: 120 },

      // SEO
      { name: "meta_title", type: "text", max: 160 },
      { name: "meta_description", type: "text", max: 320 },
      { name: "meta_keywords", type: "json", maxSize: 1024 },

      // soft stats
      { name: "sales_count", type: "number", min: 0 },
      { name: "view_count", type: "number", min: 0 },
      { name: "rating_avg", type: "number", min: 0, max: 5 },
      { name: "rating_count", type: "number", min: 0 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_products_slug ON products (slug)",
      "CREATE UNIQUE INDEX idx_products_sku ON products (sku)",
      "CREATE INDEX idx_products_type_status ON products (type, status)",
      "CREATE INDEX idx_products_category_status ON products (category, status)",
      "CREATE INDEX idx_products_featured ON products (is_featured)",
    ],
    // Public can list/view anything that's not draft/archived
    listRule: "status != \"draft\" && status != \"archived\"",
    viewRule: "status != \"draft\" && status != \"archived\"",
    createRule: "@request.auth.role = \"admin\"",
    updateRule: "@request.auth.role = \"admin\"",
    deleteRule: "@request.auth.role = \"admin\"",
  });
  app.save(c);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("products"));
});
