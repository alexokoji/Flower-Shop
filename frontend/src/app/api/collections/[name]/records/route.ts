import type { Document } from "mongodb";
import { coll } from "@/lib/db/mongo";
import { session, errorResponse, HttpError } from "@/lib/api/guard";
import { policyFor, assertAccess, sanitiseWrite, sanitiseRead } from "@/lib/api/policy";
import { parseFilter, parseSort, parseFields, andFilters } from "@/lib/api/filter";
import { toRecord, toRecords, stamps } from "@/lib/db/serialize";
import { expandRecords } from "@/lib/api/expand";
import { hooksFor } from "@/lib/api/hooks";
import { readBody } from "@/lib/api/body";

/**
 * Generic list + create, standing in for PocketBase's
 * /api/collections/{name}/records. Access is decided entirely by the table in
 * lib/api/policy.ts; this handler contains no per-collection logic.
 */

export async function GET(req: Request, ctx: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await ctx.params;
    const policy = policyFor(name);
    const s = await session();

    const scope = await policy.read(s);
    if (scope === null) throw new HttpError(s ? 403 : 401, "You do not have access to that.");

    const url = new URL(req.url);
    const filter = andFilters(scope, parseFilter(url.searchParams.get("filter")));
    const sort = parseSort(url.searchParams.get("sort"));

    const perPage = Math.min(Math.max(parseInt(url.searchParams.get("perPage") ?? "200", 10) || 200, 1), 500);
    const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);

    const projection = parseFields(url.searchParams.get("fields"));

    const c = await coll<Document>(name);
    const [docs, total] = await Promise.all([
      c.find(filter, projection ? { projection } : undefined)
        .sort(sort).skip((page - 1) * perPage).limit(perPage).toArray(),
      c.countDocuments(filter),
    ]);

    let items = toRecords(docs).map((r) => sanitiseRead(policy, r));

    const expand = url.searchParams.get("expand");
    if (expand) items = await expandRecords(items, expand);

    return Response.json({
      page,
      perPage,
      totalItems: total,
      totalPages: Math.ceil(total / perPage),
      items,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await ctx.params;
    const policy = policyFor(name);
    const s = await session();
    assertAccess(policy.create, s);

    const body = await readBody(req, { collection: name, session: s });
    const doc = sanitiseWrite(policy, body, s);

    // Ownership is stamped from the session, never taken from the payload.
    if (policy.ownerField && policy.ownerField !== "_id" && s) {
      doc[policy.ownerField] = s.uid;
    }

    // A relation-owned row must hang off a parent the caller actually owns.
    if (policy.ownerVia && s && s.role !== "admin") {
      const parentId = String(body[policy.ownerVia.localField] ?? "");
      const parent = await coll<Document>(policy.ownerVia.collection);
      const { toObjectId } = await import("@/lib/db/serialize");
      const _id = toObjectId(parentId);
      const found = _id ? await parent.findOne({ _id }) : null;
      if (!found || String(found.user) !== s.uid) {
        throw new HttpError(403, "That is not yours.");
      }
      doc[policy.ownerVia.localField] = parentId;
    }

    // Business rules that must hold regardless of caller (pricing, tracking
    // codes, timeline mirroring) — the port of the PocketBase record hooks.
    const hooks = hooksFor(name);
    const finalDoc = hooks.beforeCreate ? await hooks.beforeCreate(doc, s) : doc;

    const c = await coll<Document>(name);
    const res = await c.insertOne({ ...finalDoc, ...stamps() } as Document);
    const created = await c.findOne({ _id: res.insertedId });

    if (hooks.afterCreate) {
      await hooks.afterCreate(String(res.insertedId), finalDoc, s);
    }

    return Response.json(sanitiseRead(policy, toRecord(created)!), { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
