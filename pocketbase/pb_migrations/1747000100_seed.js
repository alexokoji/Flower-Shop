/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  // --- demo users ----------------------------------------------------------
  const users = app.findCollectionByNameOrId("users");

  const admin = new Record(users);
  admin.set("email", "admin@xperiencedelivery.test");
  admin.set("emailVisibility", true);
  admin.set("verified", true);
  admin.set("first_name", "Admin");
  admin.set("last_name", "User");
  admin.set("role", "admin");
  admin.set("preferred_currency", "USD");
  admin.set("locale", "en");
  admin.setPassword("Admin@1234");
  app.save(admin);

  const customer = new Record(users);
  customer.set("email", "customer@xperiencedelivery.test");
  customer.set("emailVisibility", true);
  customer.set("verified", true);
  customer.set("first_name", "Test");
  customer.set("last_name", "Customer");
  customer.set("role", "customer");
  customer.set("preferred_currency", "USD");
  customer.set("locale", "en");
  customer.setPassword("Customer@1234");
  app.save(customer);

  // --- categories ----------------------------------------------------------
  const categories = app.findCollectionByNameOrId("categories");
  const categorySeed = [
    ["flower", "Wedding", "Bouquets and arrangements for weddings.", true],
    ["flower", "Birthday", "Celebrate another year in bloom.", true],
    ["flower", "Valentine", "Romantic roses and arrangements.", true],
    ["flower", "Anniversary", "Mark the milestones with elegance.", false],
    ["flower", "Funeral", "Wreaths, sprays, and sympathy bouquets.", false],
    ["flower", "Graduation", "Congratulations in full bloom.", false],
    ["necklace", "Pendants", "Delicate pendants for every day.", true],
    ["necklace", "Chokers", "Statement chokers in gold and silver.", true],
    ["necklace", "Chains", "Classic chains, refined.", true],
    ["necklace", "Layered", "Layered necklace sets.", false],
    ["necklace", "Stone & Gem", "Pieces with natural stones and gems.", false],
  ];
  const catBySlug = {};
  categorySeed.forEach(([type, name, desc, featured], i) => {
    const r = new Record(categories);
    r.set("type", type);
    r.set("name", name);
    r.set("slug", slug(`${name}-${type}s`));
    r.set("description", desc);
    r.set("sort_order", i);
    r.set("is_featured", featured);
    r.set("is_active", true);
    app.save(r);
    catBySlug[`${type}:${name}`] = r;
  });

  // --- shipping rates ------------------------------------------------------
  const rates = app.findCollectionByNameOrId("shipping_rates");
  const rateSeed = [
    ["NG", "standard", 5, 2, "3-5", 150],
    ["NG", "express", 12, 4, "1-2", null],
    ["GH", "standard", 8, 3, "5-7", 200],
    ["GH", "express", 18, 6, "2-4", null],
    ["KE", "standard", 10, 3, "5-7", 200],
    ["KE", "express", 22, 7, "2-4", null],
    ["ZA", "standard", 10, 3, "5-7", 200],
    ["ZA", "express", 22, 7, "2-4", null],
    ["US", "standard", 12, 4, "5-7", 200],
    ["US", "express", 28, 9, "2-3", null],
    ["GB", "standard", 12, 4, "5-7", 200],
    ["GB", "express", 28, 9, "2-3", null],
    ["FR", "standard", 12, 4, "5-7", 200],
    ["FR", "express", 28, 9, "2-3", null],
    ["DE", "standard", 12, 4, "5-7", 200],
    ["DE", "express", 28, 9, "2-3", null],
    ["AU", "standard", 18, 5, "7-10", 250],
    ["AU", "express", 38, 11, "3-5", null],
    ["AE", "standard", 14, 4, "5-7", 200],
    ["AE", "express", 30, 9, "2-4", null],
    ["CA", "standard", 14, 4, "6-9", 200],
    ["CA", "express", 32, 10, "2-4", null],
    ["JP", "standard", 16, 5, "7-10", 250],
    ["JP", "express", 34, 10, "3-5", null],
    ["IN", "standard", 10, 3, "6-9", 200],
    ["IN", "express", 24, 8, "3-5", null],
  ];
  rateSeed.forEach(([iso, method, base, perKg, days, free]) => {
    const r = new Record(rates);
    r.set("country_iso2", iso);
    r.set("method", method);
    r.set("currency", "USD");
    r.set("base_fee", base);
    r.set("per_kg_fee", perKg);
    if (free !== null) r.set("free_threshold", free);
    r.set("delivery_days", days);
    r.set("is_active", true);
    app.save(r);
  });

  // --- products ------------------------------------------------------------
  const products = app.findCollectionByNameOrId("products");

  const flowerSeed = [
    { name: "Velvet Rouge Bouquet", cat: "Valentine", color: "red", price: 89, sale: 75,
      desc: "A radiant arrangement of velvet red roses, hand-tied with satin ribbon.",
      flowerType: "Rose", freshness: 7, care: "Trim stems daily, cool water, no direct sun." },
    { name: "White Lily Cathedral", cat: "Wedding", color: "white", price: 145,
      desc: "Tall white lilies arranged for ceremony aisles and bridal tables.",
      flowerType: "Lily", freshness: 10, care: "Remove pollen carefully; keep at 18°C." },
    { name: "Pastel Birthday Bloom", cat: "Birthday", color: "pink", price: 65,
      desc: "A soft pastel medley of peonies, ranunculus, and eucalyptus.",
      flowerType: "Mixed", freshness: 7, care: "Re-cut stems and change water every two days." },
    { name: "Golden Anniversary Spray", cat: "Anniversary", color: "gold", price: 120,
      desc: "Gold-tipped lilies, calla, and orchids in a long-form spray.",
      flowerType: "Mixed", freshness: 9, care: "Cool environment, fresh water every 2–3 days." },
    { name: "White Memorial Wreath", cat: "Funeral", color: "white", price: 175,
      desc: "A circular wreath of white roses, lilies, and chrysanthemums.",
      flowerType: "Mixed", freshness: 5, care: "Mist lightly; keep out of direct sun." },
    { name: "Graduation Sunshine", cat: "Graduation", color: "yellow", price: 55,
      desc: "Cheerful yellow roses and sunflowers tied for the big day.",
      flowerType: "Sunflower", freshness: 6, care: "Trim 1cm daily; refresh water." },
  ];
  flowerSeed.forEach((f, i) => {
    const cat = catBySlug[`flower:${f.cat}`];
    const r = new Record(products);
    r.set("category", cat.id);
    r.set("type", "flower");
    r.set("name", f.name);
    r.set("slug", slug(f.name));
    r.set("sku", "FL-" + String(i + 1).padStart(4, "0"));
    r.set("short_description", f.desc.slice(0, 90));
    r.set("description", f.desc);
    r.set("currency", "USD");
    r.set("price", f.price);
    if (f.sale) r.set("sale_price", f.sale);
    r.set("stock_quantity", 25);
    r.set("low_stock_threshold", 5);
    r.set("status", "in_stock");
    r.set("is_featured", i < 3);
    r.set("is_best_seller", i < 2);
    r.set("attributes", {
      flower_type: f.flowerType,
      color: f.color,
      occasion: f.cat,
      freshness_days: f.freshness,
      care_instructions: f.care,
    });
    r.set("weight_g", 1200);
    r.set("ships_internationally", false);
    r.set("delivery_estimate", "Same-day to 3 days within delivery zones");
    r.set("meta_title", `${f.name} — Xperience Delivery`);
    r.set("meta_description", f.desc.slice(0, 155));
    r.set("meta_keywords", ["flower", f.cat, f.color, f.flowerType]);
    app.save(r);
  });

  const necklaceSeed = [
    { name: "Rose Gold Petal Pendant", cat: "Pendants", price: 320, sale: 275,
      desc: "A 14k rose gold pendant shaped as a single petal, on a 45cm chain.",
      material: "14k Rose Gold", stone: "None", chain: 45, gender: "Women", weight: 3.4, color: "Rose Gold" },
    { name: "Diamond Solitaire Necklace", cat: "Stone & Gem", price: 1450,
      desc: "0.5ct diamond solitaire on a white-gold chain.",
      material: "18k White Gold", stone: "Diamond", chain: 42, gender: "Women", weight: 2.8, color: "White Gold" },
    { name: "Layered Pearl Trio", cat: "Layered", price: 480,
      desc: "Three-strand freshwater pearl layering set.",
      material: "Sterling Silver", stone: "Freshwater Pearl", chain: 40, gender: "Women", weight: 12.0, color: "Silver / Cream" },
    { name: "Gold Curb Chain", cat: "Chains", price: 690,
      desc: "A classic 6mm 18k gold curb chain.",
      material: "18k Gold", stone: "None", chain: 55, gender: "Unisex", weight: 28.0, color: "Gold" },
    { name: "Onyx Velvet Choker", cat: "Chokers", price: 220,
      desc: "Black onyx and velvet choker for evening wear.",
      material: "Velvet / Onyx", stone: "Black Onyx", chain: 36, gender: "Women", weight: 18.0, color: "Black" },
    { name: "Emerald Heritage Pendant", cat: "Stone & Gem", price: 1980, sale: 1750,
      desc: "Emerald centre with diamond halo, on a yellow-gold chain.",
      material: "18k Yellow Gold", stone: "Emerald", chain: 45, gender: "Women", weight: 4.5, color: "Gold / Emerald" },
  ];
  necklaceSeed.forEach((n, i) => {
    const cat = catBySlug[`necklace:${n.cat}`];
    const r = new Record(products);
    r.set("category", cat.id);
    r.set("type", "necklace");
    r.set("name", n.name);
    r.set("slug", slug(n.name));
    r.set("sku", "NK-" + String(i + 1).padStart(4, "0"));
    r.set("short_description", n.desc.slice(0, 90));
    r.set("description", n.desc);
    r.set("currency", "USD");
    r.set("price", n.price);
    if (n.sale) r.set("sale_price", n.sale);
    r.set("stock_quantity", 15);
    r.set("low_stock_threshold", 3);
    r.set("status", "in_stock");
    r.set("is_featured", i < 3);
    r.set("is_best_seller", i < 2);
    r.set("attributes", {
      material: n.material,
      stone_type: n.stone,
      chain_length_cm: n.chain,
      gender: n.gender,
      weight_g: n.weight,
      color: n.color,
    });
    r.set("weight_g", n.weight);
    r.set("ships_internationally", true);
    r.set("delivery_estimate", "Insured worldwide shipping 3–7 days");
    r.set("meta_title", `${n.name} — Xperience Delivery`);
    r.set("meta_description", n.desc.slice(0, 155));
    r.set("meta_keywords", ["necklace", n.material, n.stone, n.color]);
    app.save(r);
  });
}, (app) => {
  // Down: best-effort cleanup of seeded data.
  ["wishlists","reviews","payments","payment_webhook_events","shipment_tracking",
   "orders","products","categories","shipping_rates","coupons"].forEach((name) => {
    try {
      const c = app.findCollectionByNameOrId(name);
      const records = app.findRecordsByFilter(c, "id != ''", "", 0, 0);
      records.forEach((r) => app.delete(r));
    } catch (e) { /* collection may not exist */ }
  });
  try {
    const users = app.findCollectionByNameOrId("users");
    ["admin@xperiencedelivery.test", "customer@xperiencedelivery.test"].forEach((email) => {
      const r = app.findFirstRecordByData("users", "email", email);
      if (r) app.delete(r);
    });
  } catch (e) {}
});
