/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const c = new Collection({
    name: "categories",
    type: "base",
    fields: [
      { name: "type", type: "select", required: true, maxSelect: 1, values: ["flower", "necklace"] },
      { name: "name", type: "text", required: true, max: 80 },
      { name: "slug", type: "text", required: true, max: 100 },
      { name: "description", type: "editor" },
      { name: "image", type: "file", maxSize: 5242880, maxSelect: 1, mimeTypes: ["image/jpeg","image/png","image/webp","image/avif"] },
      { name: "sort_order", type: "number" },
      { name: "is_featured", type: "bool" },
      { name: "is_active", type: "bool" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_categories_slug ON categories (slug)",
      "CREATE INDEX idx_categories_type ON categories (type, is_active)",
    ],
    listRule: "is_active = true",
    viewRule: "is_active = true",
    createRule: "@request.auth.role = \"admin\"",
    updateRule: "@request.auth.role = \"admin\"",
    deleteRule: "@request.auth.role = \"admin\"",
  });
  app.save(c);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("categories"));
});
