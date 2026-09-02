import { ObjectId, type Document, type WithId } from "mongodb";

/**
 * MongoDB documents use `_id: ObjectId`; the frontend was written against
 * PocketBase records shaped `{ id: string, created: string, updated: string }`.
 *
 * Rather than rewrite 79 call sites and every type in src/types, the API
 * serialises documents back into that shape on the way out. Dates become ISO
 * strings so responses are plain JSON, exactly as the components already expect.
 */

export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

/** Convert one document to the record shape the UI consumes. */
export type Record_<T> = T & BaseRecord & { [key: string]: unknown };

export function toRecord<T extends Document>(doc: WithId<T> | null): Record_<T> | null {
  if (!doc) return null;
  const { _id, ...rest } = doc as WithId<Document>;

  const out: Record<string, unknown> = { id: String(_id) };
  for (const [key, value] of Object.entries(rest)) {
    out[key] = value instanceof Date ? value.toISOString() : value;
  }
  // Guarantee the timestamps the UI reads unconditionally.
  out.created ??= new Date(0).toISOString();
  out.updated ??= out.created;
  return out as Record_<T>;
}

export function toRecords<T extends Document>(docs: WithId<T>[]): Record_<T>[] {
  return docs.map((d) => toRecord(d)!).filter(Boolean);
}

/** Parse a caller-supplied id, returning null instead of throwing on garbage. */
export function toObjectId(id: string | undefined | null): ObjectId | null {
  if (!id || !ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

/** Timestamps for a new document. */
export function stamps() {
  const now = new Date();
  return { created: now, updated: now };
}

/** Timestamp for an update. */
export function touch() {
  return { updated: new Date() };
}

/**
 * Strip fields a client is never allowed to set. Applied to every write body so
 * a request cannot smuggle in `role`, `_id` or forged timestamps.
 */
export function stripReserved<T extends Record<string, unknown>>(body: T, extra: string[] = []): T {
  const banned = new Set(["_id", "id", "created", "updated", "password_hash", ...extra]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!banned.has(k)) out[k] = v;
  }
  return out as T;
}
