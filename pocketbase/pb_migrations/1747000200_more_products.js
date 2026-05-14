/// <reference path="../pb_data/types.d.ts" />

// Populates a fuller demo catalog: ~50 additional products across all
// flower occasions and necklace categories. Images are curated Unsplash
// URLs — swap any that 404 via the PocketBase admin UI (/_/).
migrate((app) => {
  const products = app.findCollectionByNameOrId("products");
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const slugImages = (slug) => [
    `https://picsum.photos/seed/${slug}-1/1200/1500`,
    `https://picsum.photos/seed/${slug}-2/1200/1500`,
    `https://picsum.photos/seed/${slug}-3/1200/1500`,
  ];

  // Memoized category lookup by `${type}:${name}` => Record
  const catCache = {};
  function cat(type, name) {
    const key = `${type}:${name}`;
    if (catCache[key]) return catCache[key];
    const r = app.findFirstRecordByFilter("categories", `type = "${type}" && name = "${name}"`);
    catCache[key] = r;
    return r;
  }

  /**
   * One flower record.
   * [name, occasion, price, salePrice (or 0), color, flowerType, freshnessDays,
   *  care, isFeatured, isBestSeller, [photoIds]]
   */
  const flowers = [
    // -- WEDDING --
    ["Cathedral White Spray", "Wedding", 185, 0, "white", "Mixed", 9,
      "Keep cool, mist daily, change water every two days.", true, false,
      ["1487530811176-3780de880c2d", "1455659817273-f96807779a8a"]],
    ["Bridal Cascade Bouquet", "Wedding", 220, 195, "white", "Rose", 8,
      "Trim stems, keep in cool water; protect from direct light.", true, true,
      ["1561835491-12b7d0e26d70", "1487530811176-3780de880c2d"]],
    ["Heritage Rose Ceremony", "Wedding", 165, 0, "pink", "Rose", 7,
      "Re-cut stems daily for longevity.", false, false,
      ["1518895949257-7621c3c786d7", "1494972308805-463bc619d34e"]],
    ["Magnolia Veil Bouquet", "Wedding", 195, 0, "white", "Magnolia", 6,
      "Magnolias bruise easily — handle gently.", false, false,
      ["1487530811176-3780de880c2d", "1452827073306-6e6e661baf57"]],
    ["Eucalyptus Wedding Trail", "Wedding", 135, 0, "green", "Eucalyptus", 14,
      "Eucalyptus dries beautifully — leave to air-dry after the day.", false, true,
      ["1561835491-12b7d0e26d70", "1599733589046-2f3d3e2e7e85"]],

    // -- BIRTHDAY --
    ["Tulip Cheer", "Birthday", 55, 0, "pink", "Tulip", 7,
      "Tulips keep growing in the vase — re-cut every two days.", true, false,
      ["1495231916356-a86217efff12", "1502139214982-d0ad755818d8"]],
    ["Confetti Mixed Bouquet", "Birthday", 68, 0, "multi", "Mixed", 7,
      "Change water daily for the brightest colors.", false, true,
      ["1452827073306-6e6e661baf57", "1495231916356-a86217efff12"]],
    ["Peach Peony Birthday", "Birthday", 89, 75, "peach", "Peony", 6,
      "Peonies open over 48 hours — keep cool to slow the bloom.", true, false,
      ["1495231916356-a86217efff12", "1502139214982-d0ad755818d8"]],
    ["Iris Garden Birthday", "Birthday", 62, 0, "purple", "Iris", 5,
      "Iris fade quickly — trim and refresh water every 24 hours.", false, false,
      ["1452827073306-6e6e661baf57", "1487530811176-3780de880c2d"]],
    ["Sunshine Daisy Mix", "Birthday", 48, 0, "yellow", "Daisy", 7,
      "Pinch off spent blooms to extend life.", false, false,
      ["1490750967868-a8f59cffd47b", "1597848212624-a19eb35e2651"]],

    // -- VALENTINE --
    ["Crimson Heart Bouquet", "Valentine", 99, 0, "red", "Rose", 7,
      "Trim daily; keep away from radiators.", true, true,
      ["1494972308805-463bc619d34e", "1518895949257-7621c3c786d7"]],
    ["Pink Romance Roses", "Valentine", 79, 0, "pink", "Rose", 7,
      "Trim daily; cool water away from direct sunlight.", true, false,
      ["1518895949257-7621c3c786d7", "1452827073306-6e6e661baf57"]],
    ["Red Tulip Surrender", "Valentine", 69, 0, "red", "Tulip", 6,
      "Tulips bend toward light — rotate the vase daily.", false, false,
      ["1495231916356-a86217efff12", "1502139214982-d0ad755818d8"]],
    ["Champagne Roses", "Valentine", 89, 0, "champagne", "Rose", 8,
      "Trim 1cm of stem daily on a 45° angle.", false, true,
      ["1525310072745-f49212b5ac6d", "1455659817273-f96807779a8a"]],
    ["Burgundy Velvet Box", "Valentine", 135, 115, "burgundy", "Rose", 14,
      "Preserved velvet roses — keep dry, out of direct sun.", true, false,
      ["1494972308805-463bc619d34e", "1518895949257-7621c3c786d7"]],

    // -- ANNIVERSARY --
    ["Silver Anniversary Whites", "Anniversary", 105, 0, "white", "Mixed", 8,
      "Mist lightly to keep silver foliage looking fresh.", false, false,
      ["1487530811176-3780de880c2d", "1599733589046-2f3d3e2e7e85"]],
    ["Calla Lily Devotion", "Anniversary", 125, 0, "white", "Calla Lily", 10,
      "Callas thrive in fresh water with stems trimmed at an angle.", true, false,
      ["1561835491-12b7d0e26d70", "1487530811176-3780de880c2d"]],
    ["Pearl Anniversary Bouquet", "Anniversary", 145, 0, "ivory", "Mixed", 9,
      "Avoid drafts; keep stems hydrated.", true, true,
      ["1455659817273-f96807779a8a", "1487530811176-3780de880c2d"]],
    ["Champagne Cascade", "Anniversary", 159, 135, "champagne", "Rose", 8,
      "Re-cut stems and refresh water every two days.", false, true,
      ["1525310072745-f49212b5ac6d", "1455659817273-f96807779a8a"]],

    // -- FUNERAL --
    ["Sympathy Standing Spray", "Funeral", 225, 0, "white", "Mixed", 5,
      "Designed for tribute display; keep cool until placement.", false, false,
      ["1599733589046-2f3d3e2e7e85", "1487530811176-3780de880c2d"]],
    ["Heart of Roses Tribute", "Funeral", 185, 0, "white", "Rose", 5,
      "Mist gently; keep out of direct sunlight.", true, false,
      ["1487530811176-3780de880c2d", "1599733589046-2f3d3e2e7e85"]],
    ["Peaceful White Bouquet", "Funeral", 115, 0, "white", "Mixed", 6,
      "Re-cut stems and refresh water every two days.", false, false,
      ["1599733589046-2f3d3e2e7e85", "1455659817273-f96807779a8a"]],
    ["Forever Garden Wreath", "Funeral", 155, 0, "white", "Mixed", 5,
      "For graveside or door — keep out of direct sun.", false, false,
      ["1599733589046-2f3d3e2e7e85", "1487530811176-3780de880c2d"]],

    // -- GRADUATION --
    ["Cap & Tassel Bouquet", "Graduation", 65, 0, "gold", "Mixed", 7,
      "Trim 1cm daily; refresh water.", true, false,
      ["1490750967868-a8f59cffd47b", "1597848212624-a19eb35e2651"]],
    ["Achievement Sunflowers", "Graduation", 55, 0, "yellow", "Sunflower", 7,
      "Pinch off spent leaves; sunflowers like fresh water.", true, true,
      ["1490750967868-a8f59cffd47b", "1597848212624-a19eb35e2651"]],
    ["Bright Future Daisies", "Graduation", 48, 0, "white", "Daisy", 7,
      "Cut on a diagonal and place in lukewarm water.", false, false,
      ["1452827073306-6e6e661baf57", "1495231916356-a86217efff12"]],
    ["Gold & White Grad Mix", "Graduation", 75, 65, "gold", "Mixed", 7,
      "Re-cut stems daily for longevity.", false, false,
      ["1525310072745-f49212b5ac6d", "1490750967868-a8f59cffd47b"]],
  ];

  /**
   * One necklace record.
   * [name, category, price, salePrice (or 0), material, stone, chainCm, gender,
   *  weightG, color, isFeatured, isBestSeller, [photoIds]]
   */
  const necklaces = [
    // -- PENDANTS --
    ["Diamond Drop Pendant", "Pendants", 580, 495, "18k White Gold", "Diamond", 42, "Women", 2.6, "White Gold",
      true, true, ["1605100804763-247f67b3557e", "1515562141207-7a88fb7ce338"]],
    ["Heart of Gold Pendant", "Pendants", 385, 0, "14k Yellow Gold", "None", 45, "Women", 3.1, "Gold",
      true, false, ["1599643477877-530eb83abc8e", "1611652022419-a9419f74343d"]],
    ["Sapphire Tear Pendant", "Pendants", 720, 0, "18k White Gold", "Sapphire", 42, "Women", 2.9, "White Gold / Blue",
      false, true, ["1605100804763-247f67b3557e", "1515562141207-7a88fb7ce338"]],
    ["Vintage Locket", "Pendants", 290, 0, "Sterling Silver", "None", 50, "Women", 6.2, "Silver",
      false, false, ["1535632066927-ab7c9ab60908", "1535632066274-2a0d54bbfc73"]],
    ["Moonstone Crescent", "Pendants", 445, 380, "Sterling Silver", "Moonstone", 45, "Women", 3.8, "Silver / Opal",
      true, false, ["1611591437281-460bfbe1220a", "1599643477877-530eb83abc8e"]],

    // -- CHOKERS --
    ["Gold Bar Choker", "Chokers", 295, 0, "14k Yellow Gold", "None", 36, "Women", 12.0, "Gold",
      true, false, ["1573408301185-9146fe634ad0", "1611591437281-460bfbe1220a"]],
    ["Pearl Strand Choker", "Chokers", 215, 0, "Freshwater Pearl", "Pearl", 36, "Women", 18.0, "Cream",
      false, true, ["1611591437281-460bfbe1220a", "1620656798579-1984d9e87df7"]],
    ["Diamond Pavé Choker", "Chokers", 895, 0, "18k White Gold", "Diamond", 36, "Women", 14.0, "White Gold",
      false, false, ["1605100804763-247f67b3557e", "1515562141207-7a88fb7ce338"]],
    ["Rose Gold Lace Choker", "Chokers", 265, 230, "14k Rose Gold", "None", 36, "Women", 11.0, "Rose Gold",
      true, false, ["1599643477877-530eb83abc8e", "1611652022419-a9419f74343d"]],

    // -- CHAINS --
    ["Silver Box Chain", "Chains", 185, 0, "Sterling Silver", "None", 55, "Unisex", 22.0, "Silver",
      false, false, ["1599643478518-a784e5dc4c8f", "1535632066927-ab7c9ab60908"]],
    ["Rose Gold Snake Chain", "Chains", 345, 0, "14k Rose Gold", "None", 50, "Unisex", 18.0, "Rose Gold",
      true, false, ["1599643478518-a784e5dc4c8f", "1599643477877-530eb83abc8e"]],
    ["Diamond-Cut Rope Chain", "Chains", 495, 425, "18k Gold", "None", 55, "Unisex", 24.0, "Gold",
      false, true, ["1599643478518-a784e5dc4c8f", "1611591437281-460bfbe1220a"]],
    ["White Gold Mariner", "Chains", 565, 0, "18k White Gold", "None", 55, "Men", 32.0, "White Gold",
      false, false, ["1535632066927-ab7c9ab60908", "1599643478518-a784e5dc4c8f"]],
    ["Vintage Byzantine Chain", "Chains", 425, 0, "Sterling Silver", "None", 60, "Unisex", 35.0, "Silver",
      true, false, ["1535632066274-2a0d54bbfc73", "1535632066927-ab7c9ab60908"]],

    // -- LAYERED --
    ["Triple Gold Strand", "Layered", 495, 0, "14k Gold", "None", 42, "Women", 16.0, "Gold",
      true, true, ["1611591437281-460bfbe1220a", "1599643477877-530eb83abc8e"]],
    ["Mixed Metal Layers", "Layered", 385, 320, "Mixed Metals", "None", 45, "Women", 14.0, "Gold / Silver",
      true, false, ["1611591437281-460bfbe1220a", "1620656798579-1984d9e87df7"]],
    ["Charm Trio Layered", "Layered", 315, 0, "Sterling Silver", "None", 40, "Women", 13.0, "Silver",
      false, false, ["1620656798579-1984d9e87df7", "1611591437281-460bfbe1220a"]],
    ["Diamond Star Layers", "Layered", 645, 0, "18k White Gold", "Diamond", 42, "Women", 12.0, "White Gold",
      false, true, ["1605100804763-247f67b3557e", "1611591437281-460bfbe1220a"]],

    // -- STONE & GEM --
    ["Ruby Drop Necklace", "Stone & Gem", 1290, 1150, "18k Yellow Gold", "Ruby", 42, "Women", 3.4, "Gold / Red",
      true, true, ["1535632066274-2a0d54bbfc73", "1611652022419-a9419f74343d"]],
    ["Tanzanite Cluster", "Stone & Gem", 1450, 0, "18k White Gold", "Tanzanite", 45, "Women", 4.2, "White Gold / Blue",
      false, false, ["1605100804763-247f67b3557e", "1515562141207-7a88fb7ce338"]],
    ["Aquamarine Riviera", "Stone & Gem", 890, 0, "18k White Gold", "Aquamarine", 42, "Women", 3.8, "White Gold / Blue",
      true, false, ["1605100804763-247f67b3557e", "1535632066274-2a0d54bbfc73"]],
    ["Black Diamond Pendant", "Stone & Gem", 1180, 980, "18k Black Gold", "Black Diamond", 50, "Unisex", 4.0, "Black / Diamond",
      false, true, ["1535632066274-2a0d54bbfc73", "1573408301185-9146fe634ad0"]],
  ];

  let flowerSku = 1001;
  for (const f of flowers) {
    const [name, occasion, price, sale, color, flowerType, freshness, care, featured, bestseller, photos] = f;
    const slug = slugify(name);
    try { app.findFirstRecordByFilter("products", `slug = "${slug}"`); continue; } catch (e) { /* not exists, proceed */ }

    const category = cat("flower", occasion);
    const r = new Record(products);
    r.set("category", category.id);
    r.set("type", "flower");
    r.set("name", name);
    r.set("slug", slug);
    r.set("sku", "FL-" + String(flowerSku++).padStart(4, "0"));
    r.set("short_description", care.length > 90 ? care.substring(0, 87) + "..." : care);
    r.set("description", `Hand-tied by our florist team. ${care}`);
    r.set("currency", "USD");
    r.set("price", price);
    if (sale > 0) r.set("sale_price", sale);
    r.set("stock_quantity", 10 + Math.floor(Math.random() * 30));
    r.set("low_stock_threshold", 5);
    r.set("status", "in_stock");
    r.set("is_featured", featured);
    r.set("is_best_seller", bestseller);
    r.set("attributes", {
      flower_type: flowerType,
      color: color,
      occasion: occasion,
      freshness_days: freshness,
      care_instructions: care,
    });
    r.set("weight_g", 1000 + Math.floor(Math.random() * 800));
    r.set("ships_internationally", false);
    r.set("delivery_estimate", "Same-day to 3 days within delivery zones");
    r.set("meta_title", `${name} — Xperience Delivery`);
    r.set("meta_description", `${name}: ${flowerType.toLowerCase()} for ${occasion.toLowerCase()}.`);
    r.set("meta_keywords", ["flower", occasion, color, flowerType]);
    r.set("image_urls", slugImages(slug));
    app.save(r);
  }

  let necklaceSku = 1001;
  for (const n of necklaces) {
    const [name, catName, price, sale, material, stone, chainCm, gender, weightG, color, featured, bestseller, photos] = n;
    const slug = slugify(name);
    try { app.findFirstRecordByFilter("products", `slug = "${slug}"`); continue; } catch (e) { /* not exists, proceed */ }

    const category = cat("necklace", catName);
    const r = new Record(products);
    r.set("category", category.id);
    r.set("type", "necklace");
    r.set("name", name);
    r.set("slug", slug);
    r.set("sku", "NK-" + String(necklaceSku++).padStart(4, "0"));
    const blurb = `${material}${stone !== "None" ? ` with ${stone}` : ""}, ${chainCm}cm chain.`;
    r.set("short_description", blurb);
    r.set("description", `<p>${name}. ${blurb} Hand-finished and inspected before dispatch. Comes in a velvet-lined gift box.</p>`);
    r.set("currency", "USD");
    r.set("price", price);
    if (sale > 0) r.set("sale_price", sale);
    r.set("stock_quantity", 5 + Math.floor(Math.random() * 20));
    r.set("low_stock_threshold", 3);
    r.set("status", "in_stock");
    r.set("is_featured", featured);
    r.set("is_best_seller", bestseller);
    r.set("attributes", {
      material: material,
      stone_type: stone,
      chain_length_cm: chainCm,
      gender: gender,
      weight_g: weightG,
      color: color,
    });
    r.set("weight_g", weightG);
    r.set("ships_internationally", true);
    r.set("delivery_estimate", "Insured worldwide shipping 3–7 days");
    r.set("meta_title", `${name} — Xperience Delivery`);
    r.set("meta_description", `${name}: ${material} ${stone !== "None" ? `set with ${stone}` : ""} ${chainCm}cm.`);
    r.set("meta_keywords", ["necklace", material, stone, color]);
    r.set("image_urls", slugImages(slug));
    app.save(r);
  }
}, (app) => {
  // Down: best-effort cleanup by SKU prefix range we used.
  try {
    const removed = app.findRecordsByFilter("products", `sku ~ "FL-1" || sku ~ "NK-1"`, "", 0, 0);
    removed.forEach((r) => app.delete(r));
  } catch (e) { /* ignore */ }
});