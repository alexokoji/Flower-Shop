#!/usr/bin/env node
/**
 * Initialise the MongoDB database: create indexes, then optionally seed an
 * admin user and the reference data the storefront needs to render.
 *
 *   node scripts/db-setup.mjs               # indexes only
 *   node scripts/db-setup.mjs --seed        # indexes + demo catalogue
 *   node scripts/db-setup.mjs --admin       # indexes + create/update an admin
 *
 * Reads MONGODB_URI / MONGODB_DB from .env.local. Safe to re-run: indexes are
 * idempotent and seeding upserts by slug rather than inserting duplicates.
 */
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import path from "node:path";

/* ------------------------------------------------------------------ env -- */
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, vRaw] = m;
      if (process.env[k]) continue;
      process.env[k] = vRaw.replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "xperience";

if (!URI) {
  console.error("MONGODB_URI is not set. Add it to frontend/.env.local first.");
  process.exit(1);
}
if (URI.includes("<db_password>")) {
  console.error(
    "MONGODB_URI still contains the <db_password> placeholder.\n" +
      "Replace it with the real Atlas password in frontend/.env.local, then re-run."
  );
  process.exit(1);
}

const args = new Set(process.argv.slice(2));

/* -------------------------------------------------------------- indexes -- */
const INDEXES = {
  users: [
    { key: { email: 1 }, unique: true, name: "uniq_users_email" },
    { key: { role: 1 }, name: "idx_users_role" },
  ],
  categories: [
    { key: { slug: 1 }, unique: true, name: "uniq_categories_slug" },
    { key: { type: 1, is_active: 1 }, name: "idx_categories_type_active" },
  ],
  products: [
    { key: { slug: 1 }, unique: true, name: "uniq_products_slug" },
    { key: { sku: 1 }, unique: true, name: "uniq_products_sku" },
    { key: { type: 1, status: 1 }, name: "idx_products_type_status" },
    { key: { category: 1 }, name: "idx_products_category" },
    { key: { name: "text", short_description: "text" }, name: "text_products_search" },
  ],
  addresses: [{ key: { user: 1 }, name: "idx_addresses_user" }],
  shipping_rates: [{ key: { country_iso2: 1, method: 1 }, unique: true, name: "uniq_rates" }],
  coupons: [{ key: { code: 1 }, unique: true, name: "uniq_coupons_code" }],
  orders: [
    { key: { order_number: 1 }, unique: true, name: "uniq_orders_number" },
    { key: { user: 1 }, name: "idx_orders_user" },
    { key: { status: 1 }, name: "idx_orders_status" },
  ],
  shipment_tracking: [{ key: { order: 1, occurred_at: -1 }, name: "idx_tracking_order" }],
  reviews: [
    { key: { product: 1, status: 1 }, name: "idx_reviews_product_status" },
    { key: { user: 1 }, name: "idx_reviews_user" },
  ],
  payments: [{ key: { order: 1 }, name: "idx_payments_order" }],
  payment_webhook_events: [
    { key: { provider: 1, event_id: 1 }, unique: true, name: "uniq_webhook_event" },
  ],
  wishlists: [{ key: { user: 1, product: 1 }, unique: true, name: "uniq_wishlist" }],
  carts: [{ key: { user: 1 }, unique: true, name: "uniq_carts_user" }],
  shipments: [
    { key: { tracking_code: 1 }, unique: true, name: "uniq_shipments_tracking_code" },
    { key: { user: 1 }, name: "idx_shipments_user" },
    { key: { status: 1 }, name: "idx_shipments_status" },
    { key: { public_token: 1 }, name: "idx_shipments_public_token" },
  ],
  shipment_events: [{ key: { shipment: 1, occurred_at: -1 }, name: "idx_shipment_events" }],
  shipment_payments: [
    { key: { shipment: 1 }, name: "idx_sp_shipment" },
    { key: { status: 1 }, name: "idx_sp_status" },
    { key: { reference: 1 }, name: "idx_sp_reference" },
  ],
  logistics_settings: [{ key: { key: 1 }, unique: true, name: "uniq_settings_key" }],
};

const now = () => new Date();
const stamps = () => ({ created: now(), updated: now() });

/* ----------------------------------------------------------------- seed -- */
const CATEGORIES = [
  { type: "flower", name: "Roses", slug: "roses", description: "Classic long-stem roses." },
  { type: "flower", name: "Bouquets", slug: "bouquets", description: "Hand-tied seasonal bouquets." },
  { type: "flower", name: "Orchids", slug: "orchids", description: "Elegant potted orchids." },
  { type: "necklace", name: "Gold", slug: "gold", description: "18k gold necklaces." },
  { type: "necklace", name: "Pearls", slug: "pearls", description: "Freshwater pearl strands." },
  { type: "necklace", name: "Diamonds", slug: "diamonds", description: "Certified diamond pendants." },
];

const PRODUCTS = [
  ["flower", "roses", "Crimson Grace", "crimson-grace", "XD-FL-001", 89, 0, "A dozen deep red roses, hand-tied."],
  ["flower", "roses", "Blush Whisper", "blush-whisper", "XD-FL-002", 79, 69, "Soft pink roses with eucalyptus."],
  ["flower", "bouquets", "Golden Hour", "golden-hour", "XD-FL-003", 110, 0, "Sunflowers, ranunculus and freesia."],
  ["flower", "bouquets", "Morning Dew", "morning-dew", "XD-FL-004", 95, 0, "White peonies and lisianthus."],
  ["flower", "orchids", "Silent Elegance", "silent-elegance", "XD-FL-005", 140, 125, "Double-stem white phalaenopsis."],
  ["flower", "orchids", "Violet Muse", "violet-muse", "XD-FL-006", 155, 0, "Deep purple orchid in a ceramic pot."],
  ["necklace", "gold", "Aurelia Chain", "aurelia-chain", "XD-NK-001", 480, 0, "18k gold rope chain, 45cm."],
  ["necklace", "gold", "Solene Pendant", "solene-pendant", "XD-NK-002", 620, 549, "Hammered gold sun pendant."],
  ["necklace", "pearls", "Lune Strand", "lune-strand", "XD-NK-003", 390, 0, "Freshwater pearls, silver clasp."],
  ["necklace", "pearls", "Ondine Drop", "ondine-drop", "XD-NK-004", 445, 0, "Single baroque pearl on gold."],
  ["necklace", "diamonds", "Etoile Solitaire", "etoile-solitaire", "XD-NK-005", 1850, 0, "0.5ct brilliant-cut solitaire."],
  ["necklace", "diamonds", "Nova Halo", "nova-halo", "XD-NK-006", 2400, 2150, "Halo pendant, 0.75ct total."],
];

const SHIPPING = [
  ["NG", 8, 15], ["GH", 18, 30], ["KE", 20, 34], ["ZA", 22, 36], ["EG", 24, 38],
  ["US", 26, 45], ["CA", 28, 47], ["GB", 24, 42], ["FR", 25, 43], ["DE", 25, 43],
  ["AE", 27, 46], ["CN", 30, 52], ["AU", 32, 55],
];

async function seed(db) {
  console.log("\nSeeding reference data…");

  const catIds = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const doc = {
      ...c,
      image: "",
      image_url: `https://picsum.photos/seed/${c.slug}/800/800`,
      sort_order: i,
      is_featured: i < 3,
      is_active: true,
    };
    const res = await db.collection("categories").findOneAndUpdate(
      { slug: c.slug },
      { $set: { ...doc, updated: now() }, $setOnInsert: { created: now() } },
      { upsert: true, returnDocument: "after" }
    );
    catIds[c.slug] = String((res.value ?? res)._id);
  }
  console.log(`  categories: ${CATEGORIES.length}`);

  for (const [type, cat, name, slug, sku, price, sale, blurb] of PRODUCTS) {
    const doc = {
      category: catIds[cat],
      type,
      name,
      slug,
      sku,
      short_description: blurb,
      description: `${blurb} Presented in Xperience Delivery signature packaging.`,
      currency: "USD",
      price,
      sale_price: sale,
      stock_quantity: 25,
      low_stock_threshold: 5,
      status: "in_stock",
      is_featured: sale > 0,
      is_best_seller: false,
      attributes: {},
      images: [],
      image_urls: [
        `https://picsum.photos/seed/${slug}-1/900/1100`,
        `https://picsum.photos/seed/${slug}-2/900/1100`,
      ],
      weight_g: type === "flower" ? 1200 : 180,
      ships_internationally: true,
      restricted_countries: null,
      delivery_estimate: type === "flower" ? "1–3 days" : "3–7 days",
      meta_title: name,
      meta_description: blurb,
      meta_keywords: null,
      sales_count: 0,
      view_count: 0,
      rating_avg: 0,
      rating_count: 0,
    };
    await db.collection("products").updateOne(
      { slug },
      { $set: { ...doc, updated: now() }, $setOnInsert: { created: now() } },
      { upsert: true }
    );
  }
  console.log(`  products: ${PRODUCTS.length}`);

  for (const [iso, std, exp] of SHIPPING) {
    for (const [method, base] of [["standard", std], ["express", exp]]) {
      await db.collection("shipping_rates").updateOne(
        { country_iso2: iso, method },
        {
          $set: {
            country_iso2: iso, method, base_fee: base, per_kg_fee: base / 8,
            min_fee: base, max_fee: base * 4, free_threshold: method === "standard" ? 500 : 0,
            delivery_days: method === "standard" ? "3-7" : "1-3",
            currency: "USD", is_active: true, updated: now(),
          },
          $setOnInsert: { created: now() },
        },
        { upsert: true }
      );
    }
  }
  console.log(`  shipping rates: ${SHIPPING.length * 2}`);

  await db.collection("logistics_settings").updateOne(
    { key: "default" },
    {
      $set: { updated: now() },
      $setOnInsert: {
        key: "default",
        bank_transfer_enabled: true,
        bank_name: "", bank_account_name: "", bank_account_number: "",
        bank_branch: "", bank_swift: "",
        bank_instructions: "Use your shipment tracking code as the transfer narration.",
        paymentpoint_enabled: false, paymentpoint_business_id: "",
        paymentpoint_api_key: "", paymentpoint_secret_key: "",
        paymentpoint_base_url: "https://api.paymentpoint.co/api/v1",
        paymentpoint_bank_code: "",
        payment_currency: "NGN", support_email: "", support_phone: "",
        // Flat price charged for every shipment; adjust in /admin/logistics.
        shipment_flat_fee: 25,
        created: now(),
      },
    },
    { upsert: true }
  );
  console.log("  logistics settings: 1");
}

/* ---------------------------------------------------------------- admin -- */
async function createAdmin(db) {
  console.log("\nCreate an administrator account");

  let email, password, first, last;

  // Non-interactive path, for CI and for shells without a TTY.
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    password = process.env.ADMIN_PASSWORD;
    first = (process.env.ADMIN_FIRST_NAME || "Admin").trim();
    last = (process.env.ADMIN_LAST_NAME || "User").trim();
    console.log(`  using ADMIN_EMAIL from the environment: ${email}`);
  } else if (!process.stdin.isTTY) {
    console.error(
      "  No TTY available and ADMIN_EMAIL / ADMIN_PASSWORD are not set.\n" +
      "  Either run this in an interactive terminal, or:\n" +
      '    $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="…"; npm run db:admin'
    );
    return;
  } else {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    email = (await rl.question("  email: ")).trim().toLowerCase();
    password = (await rl.question("  password (min 8 chars): ")).trim();
    first = (await rl.question("  first name [Admin]: ")).trim() || "Admin";
    last = (await rl.question("  last name [User]: ")).trim() || "User";
    rl.close();
  }

  if (!email.includes("@") || password.length < 8) {
    console.error("  Invalid email or password too short — skipped.");
    return;
  }

  await db.collection("users").updateOne(
    { email },
    {
      $set: {
        email,
        password_hash: await bcrypt.hash(password, 12),
        role: "admin",
        first_name: first,
        last_name: last,
        verified: true,
        updated: now(),
      },
      $setOnInsert: {
        phone: "", marketing_opt_in: false,
        preferred_currency: "USD", locale: "en", created: now(),
      },
    },
    { upsert: true }
  );
  console.log(`  admin ready: ${email}`);
}

/* ----------------------------------------------------------------- main -- */
const client = new MongoClient(URI, { serverSelectionTimeoutMS: 15000 });

try {
  console.log(`Connecting to ${DB_NAME}…`);
  await client.connect();
  const db = client.db(DB_NAME);
  await db.command({ ping: 1 });
  console.log("Connected.\n");

  console.log("Creating indexes…");
  for (const [name, specs] of Object.entries(INDEXES)) {
    try {
      await db.collection(name).createIndexes(specs);
      console.log(`  ${name}: ${specs.length}`);
    } catch (err) {
      console.log(`  ${name}: FAILED — ${err.message}`);
    }
  }

  if (args.has("--seed")) await seed(db);
  if (args.has("--admin")) await createAdmin(db);

  console.log("\nDone.");
} catch (err) {
  console.error("\nFailed:", err.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
