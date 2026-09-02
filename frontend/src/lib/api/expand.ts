import type { Document } from "mongodb";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toRecord, toObjectId } from "@/lib/db/serialize";
import { HttpError } from "@/lib/api/guard";

/**
 * PocketBase's `expand` — resolve relation ids into nested records, so
 * `?expand=category` yields `record.expand.category`.
 *
 * Only the relations below can be expanded. An open-ended version would let a
 * caller pull any collection through a relation and sidestep its own policy —
 * so `user` deliberately exposes a trimmed public shape, never the full row.
 */

const RELATIONS: Record<string, { collection: string; publicFields?: string[] }> = {
  category: { collection: C.categories },
  product: { collection: C.products },
  shipment: { collection: C.shipments },
  order: { collection: C.orders },
  // A review shows its author's name — never their email or anything else.
  user: { collection: C.users, publicFields: ["first_name", "last_name"] },
};

type Rec = { [key: string]: unknown };

export async function expandRecords<T extends Rec>(records: T[], expand: string): Promise<T[]> {
  if (!records.length) return records;

  const fields = expand
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 5);

  for (const field of fields) {
    const rel = RELATIONS[field];
    if (!rel) throw new HttpError(400, `Cannot expand: ${field}`);

    // Gather the distinct ids referenced by this batch, then one query for all.
    const ids = new Set<string>();
    for (const r of records) {
      const v = r[field];
      if (typeof v === "string" && v) ids.add(v);
    }
    if (!ids.size) continue;

    const objectIds = [...ids].map(toObjectId).filter((x): x is NonNullable<typeof x> => !!x);
    if (!objectIds.length) continue;

    const c = await coll<Document>(rel.collection);
    const docs = await c.find({ _id: { $in: objectIds } }).toArray();

    const byId = new Map<string, Record<string, unknown>>();
    for (const doc of docs) {
      let record = toRecord(doc)! as Record<string, unknown>;
      if (rel.publicFields) {
        const trimmed: Record<string, unknown> = { id: record.id };
        for (const f of rel.publicFields) trimmed[f] = record[f];
        record = trimmed;
      }
      byId.set(String(record.id), record);
    }

    for (const r of records) {
      const v = r[field];
      if (typeof v !== "string") continue;
      const hit = byId.get(v);
      if (!hit) continue;
      const target = r as Rec;
      target.expand ??= {};
      (target.expand as Record<string, unknown>)[field] = hit;
    }
  }

  return records;
}
