#!/usr/bin/env node
/**
 * Copy data out of a running PocketBase instance into MongoDB.
 *
 *   PB_URL=http://localhost:8090 \
 *   PB_SUPERUSER=you@example.com PB_SUPERUSER_PASSWORD=... \
 *   node scripts/migrate-from-pocketbase.mjs [--dry-run]
 *
 * PocketBase ids are 15-char strings while MongoDB uses 12-byte ObjectIds, so
 * the script builds an id map per collection on the first pass and rewrites
 * every relation field on the second. Order matters: parents before children.
 *
 * Re-runnable: documents are upserted on their original PocketBase id, which is
 * kept in `pb_id` for exactly that reason.
 */
import { MongoClient, ObjectId } from "mongodb";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/* ------------------------------------------------------------------ env -- */
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]]) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const PB_URL = (process.env.PB_URL || "http://localhost:8090").replace(/\/+$/, "");
const PB_EMAIL = process.env.PB_SUPERUSER;
const PB_PASSWORD = process.env.PB_SUPERUSER_PASSWORD;
const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "xperience";
const DRY = process.argv.includes("--dry-run");

if (!URI || URI.includes("<db_password>")) {
  console.error("MONGODB_URI is missing or still has the <db_password> placeholder.");
  process.exit(1);
}
if (!PB_EMAIL || !PB_PASSWORD) {
  console.error(
    "Set PB_SUPERUSER and PB_SUPERUSER_PASSWORD (a PocketBase superuser) so every row is readable."
  );
  process.exit(1);
}

/* --------------------------------------------------- collections in order -- */
// Parents first: a child's relations are remapped using ids already seen.
const ORDER = [
  { name: "users", relations: {} },
  { name: "categories", relations: {} },
  { name: "products", relations: { category: "categories" } },
  { name: "addresses", relations: { user: "users" } },
  { name: "shipping_rates", relations: {} },
  { name: "coupons", relations: {} },
  { name: "carts", relations: { user: "users" } },
  { name: "wishlists", relations: { user: "users", product: "products" } },
  { name: "orders", relations: { user: "users", coupon: "coupons" } },
  { name: "shipment_tracking", relations: { order: "orders" } },
  { name: "reviews", relations: { product: "products", user: "users" } },
  { name: "payments", relations: { order: "orders", user: "users" } },
  { name: "payment_webhook_events", relations: {} },
  { name: "logistics_settings", relations: {} },
  { name: "shipments", relations: { user: "users" } },
  { name: "shipment_events", relations: { shipment: "shipments", created_by: "users" } },
  { name: "shipment_payments", relations: { shipment: "shipments", user: "users" } },
];

const DATE_FIELDS = new Set([
  "created", "updated", "placed_at", "paid_at", "shipped_at", "delivered_at",
  "cancelled_at", "occurred_at", "approved_at", "authorized_at", "captured_at",
  "refunded_at", "starts_at", "ends_at", "last_login_at", "pickup_date",
  "estimated_delivery", "reset_expires",
]);

// PocketBase internals that have no meaning in MongoDB.
const DROP = new Set([
  "collectionId", "collectionName", "expand",
  "password", "tokenKey", "emailVisibility", "verified_old",
]);

/* ----------------------------------------------------------------- auth -- */
async function pbAuth() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
  });
  if (!res.ok) throw new Error(`PocketBase auth failed: ${res.status} ${await res.text()}`);
  return (await res.json()).token;
}

async function pbFetchAll(token, name) {
  const out = [];
  let page = 1;
  for (;;) {
    const url = `${PB_URL}/api/collections/${name}/records?perPage=200&page=${page}`;
    const res = await fetch(url, { headers: { Authorization: token } });
    if (res.status === 404) return null; // collection does not exist
    if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
    const body = await res.json();
    out.push(...body.items);
    if (page >= body.totalPages || !body.items.length) break;
    page++;
  }
  return out;
}

/* ------------------------------------------------------------ transform -- */
function convert(record, relations, idMap) {
  const doc = {};
  for (const [k, v] of Object.entries(record)) {
    if (k === "id" || DROP.has(k)) continue;

    if (relations[k]) {
      // Rewrite the relation to the new MongoDB id; drop it if the target is
      // missing rather than leaving a dangling reference.
      const mapped = idMap[relations[k]]?.get(v);
      if (v && mapped) doc[k] = mapped;
      continue;
    }

    if (DATE_FIELDS.has(k)) {
      if (!v) continue;
      const d = new Date(String(v).replace(" ", "T"));
      doc[k] = isNaN(d.getTime()) ? undefined : d;
      continue;
    }

    doc[k] = v;
  }

  doc.pb_id = record.id; // lets the script be re-run idempotently
  if (!doc.created) doc.created = new Date();
  doc.updated = new Date();
  return doc;
}

/* ----------------------------------------------------------------- main -- */
const client = new MongoClient(URI, { serverSelectionTimeoutMS: 15000 });

try {
  console.log(`PocketBase: ${PB_URL}`);
  console.log(`MongoDB:    ${DB_NAME}${DRY ? "  (DRY RUN — nothing will be written)" : ""}\n`);

  const token = await pbAuth();
  console.log("Authenticated with PocketBase.\n");

  await client.connect();
  const db = client.db(DB_NAME);

  const idMap = {};
  let grandTotal = 0;

  for (const { name, relations } of ORDER) {
    const rows = await pbFetchAll(token, name);
    if (rows === null) {
      console.log(`${name.padEnd(24)} — not present, skipped`);
      continue;
    }
    if (!rows.length) {
      console.log(`${name.padEnd(24)} 0`);
      idMap[name] = new Map();
      continue;
    }

    idMap[name] = new Map();
    const coll = db.collection(name);
    let written = 0;

    for (const row of rows) {
      const doc = convert(row, relations, idMap);

      if (DRY) {
        idMap[name].set(row.id, String(new ObjectId()));
        written++;
        continue;
      }

      // Upsert on the original id so re-running updates rather than duplicates.
      const existing = await coll.findOne({ pb_id: row.id }, { projection: { _id: 1 } });
      if (existing) {
        await coll.updateOne({ _id: existing._id }, { $set: doc });
        idMap[name].set(row.id, String(existing._id));
      } else {
        const res = await coll.insertOne(doc);
        idMap[name].set(row.id, String(res.insertedId));
      }
      written++;
    }

    grandTotal += written;
    console.log(`${name.padEnd(24)} ${written}`);
  }

  console.log(`\n${DRY ? "Would migrate" : "Migrated"} ${grandTotal} documents.`);
  if (!DRY) {
    console.log(
      "\nNOTE: user passwords are hashed by PocketBase and cannot be carried over.\n" +
      "Every migrated customer must use 'Forgot password' to set a new one, and\n" +
      "you should create an admin with:  npm run db:admin"
    );
  }
} catch (err) {
  console.error("\nFailed:", err.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
