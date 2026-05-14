/// <reference path="../pb_data/types.d.ts" />

// Adds an `image_urls` JSON field to products and seeds the 12 demo
// products with stable Picsum.photos URLs keyed by slug. Picsum is used
// because Unsplash CDN photo IDs we tried were inconsistent.
//
// Each demo product gets 3 deterministic images: {slug}-1, {slug}-2, {slug}-3.
// Real product photography can be supplied later by editing `image_urls`
// or uploading files via the PocketBase admin UI.
migrate((app) => {
  const products = app.findCollectionByNameOrId("products");

  if (!products.fields.getByName("image_urls")) {
    products.fields.add(new Field({
      name: "image_urls",
      type: "json",
      maxSize: 4096,
    }));
    app.save(products);
  }

  const slugs = [
    "velvet-rouge-bouquet", "white-lily-cathedral", "pastel-birthday-bloom",
    "golden-anniversary-spray", "white-memorial-wreath", "graduation-sunshine",
    "rose-gold-petal-pendant", "diamond-solitaire-necklace", "layered-pearl-trio",
    "gold-curb-chain", "onyx-velvet-choker", "emerald-heritage-pendant",
  ];

  for (const slug of slugs) {
    try {
      const r = app.findFirstRecordByFilter("products", `slug = "${slug}"`);
      r.set("image_urls", [
        `https://picsum.photos/seed/${slug}-1/1200/1500`,
        `https://picsum.photos/seed/${slug}-2/1200/1500`,
        `https://picsum.photos/seed/${slug}-3/1200/1500`,
      ]);
      app.save(r);
    } catch (e) { /* product missing — silently skip */ }
  }
}, (app) => {
  const products = app.findCollectionByNameOrId("products");
  const f = products.fields.getByName("image_urls");
  if (f) products.fields.removeById(f.id);
  app.save(products);
});