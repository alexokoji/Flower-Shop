/// <reference path="../pb_data/types.d.ts" />

/**
 * Sets `image_urls` on every product to themed LoremFlickr.com URLs.
 * LoremFlickr serves CC-licensed photos from Flickr by tag — flowers stay
 * flowers, necklaces stay necklaces. The `?lock=N` parameter makes the
 * same URL always return the same photo, so each product keeps a stable
 * image across reloads.
 *
 * To use real curated product photography later, just edit `image_urls`
 * on any product via the PocketBase admin UI (/_/).
 */
migrate((app) => {
  function stringHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h * 31 + s.charCodeAt(i)) & 0x7FFFFFFF);
    return (h % 99000) + 1000;
  }
  function lower(v) { return v == null ? "" : String(v).toLowerCase(); }

  function flowerTags(attrs) {
    const occasion = lower(attrs.occasion);
    const color = lower(attrs.color);
    const ftype = lower(attrs.flower_type);
    let tags = ["flowers", "bouquet"];
    if (/valentine/.test(occasion))   tags = ["roses", "red", "romance"];
    else if (/wedding/.test(occasion))    tags = ["wedding", "bouquet", "white", "flowers"];
    else if (/birthday/.test(occasion))   tags = ["flowers", "bouquet", "colorful"];
    else if (/anniversary/.test(occasion)) tags = ["flowers", "elegant", "bouquet"];
    else if (/funeral/.test(occasion))    tags = ["lilies", "white", "wreath"];
    else if (/graduation/.test(occasion)) tags = ["sunflowers", "yellow", "bouquet"];

    if (/rose/.test(ftype))         tags = ["roses", color, "bouquet"];
    else if (/lily/.test(ftype))    tags = ["lilies", color, "flowers"];
    else if (/tulip/.test(ftype))   tags = ["tulips", color];
    else if (/peony/.test(ftype))   tags = ["peonies", color, "bouquet"];
    else if (/sunflower/.test(ftype)) tags = ["sunflowers", "yellow"];
    else if (/iris/.test(ftype))    tags = ["iris", color];
    else if (/daisy/.test(ftype))   tags = ["daisies", color];
    else if (/calla/.test(ftype))   tags = ["calla", "lilies", color];
    else if (/magnolia/.test(ftype)) tags = ["magnolia", color];
    else if (/eucalyptus/.test(ftype)) tags = ["eucalyptus", "green"];

    return tags.filter((t) => t && t !== "multi" && t !== "mixed").join(",");
  }

  function necklaceTags(attrs, catName) {
    const stone = lower(attrs.stone_type);
    const material = lower(attrs.material);
    const cn = lower(catName);
    let tags = ["necklace", "jewelry"];
    if (/pendant/.test(cn))     tags = ["pendant", "necklace", "jewelry"];
    else if (/choker/.test(cn)) tags = ["choker", "necklace", "jewelry"];
    else if (/chain/.test(cn))  tags = ["chain", "necklace", "gold"];
    else if (/layered/.test(cn)) tags = ["necklace", "layered", "jewelry"];
    else if (/stone|gem/.test(cn)) tags = ["diamond", "necklace", "gemstone"];

    if (stone && stone !== "none") {
      if (/diamond/.test(stone))             tags = ["diamond", "necklace", "jewelry"];
      else if (/pearl/.test(stone))          tags = ["pearl", "necklace"];
      else if (/emerald/.test(stone))        tags = ["emerald", "necklace", "gemstone"];
      else if (/ruby/.test(stone))           tags = ["ruby", "necklace", "gemstone"];
      else if (/sapphire/.test(stone))       tags = ["sapphire", "necklace", "gemstone"];
      else if (/onyx/.test(stone))           tags = ["black", "choker", "jewelry"];
      else if (/moonstone/.test(stone))      tags = ["moonstone", "necklace"];
      else if (/tanzanite|aquamarine/.test(stone)) tags = ["blue", "necklace", "gemstone"];
    }
    if (/gold/.test(material))   tags.push("gold");
    else if (/silver/.test(material)) tags.push("silver");

    return Array.from(new Set(tags)).join(",");
  }

  const catCache = {};
  function catName(id) {
    if (catCache[id]) return catCache[id];
    try {
      const c = app.findRecordById("categories", id);
      catCache[id] = c.get("name");
      return catCache[id];
    } catch (_) { return ""; }
  }

  const products = app.findRecordsByFilter("products", "id != ''", "", 0, 0);
  for (const p of products) {
    const slug = p.get("slug") || p.id;
    const attrs = p.get("attributes") || {};
    const tags = p.get("type") === "flower"
      ? flowerTags(attrs)
      : necklaceTags(attrs, catName(p.get("category")));
    const safeTags = tags || (p.get("type") === "flower" ? "flowers,bouquet" : "necklace,jewelry");
    const h = stringHash(slug);
    p.set("image_urls", [
      `https://loremflickr.com/1200/1500/${safeTags}?lock=${h}`,
      `https://loremflickr.com/1200/1500/${safeTags}?lock=${h + 1}`,
      `https://loremflickr.com/1200/1500/${safeTags}?lock=${h + 2}`,
    ]);
    app.save(p);
  }
}, (app) => { /* no-op rollback */ });