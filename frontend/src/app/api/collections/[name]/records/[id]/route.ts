import type { Document } from "mongodb";
import { coll } from "@/lib/db/mongo";
import { session, errorResponse, HttpError } from "@/lib/api/guard";
import { policyFor, assertAccess, sanitiseWrite, sanitiseRead } from "@/lib/api/policy";
import { andFilters } from "@/lib/api/filter";
import { toRecord, toObjectId, touch } from "@/lib/db/serialize";
import { expandRecords } from "@/lib/api/expand";
import { hooksFor } from "@/lib/api/hooks";
import { readBody } from "@/lib/api/body";

/** Generic view / update / delete for a single record. */

type Ctx = { params: Promise<{ name: string; id: string }> };

/**
 * Resolve the record with the caller's read scope already applied, so a row
 * outside their scope is indistinguishable from one that does not exist.
 */
async function findScoped(name: string, id: string, scope: Record<string, unknown>) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const c = await coll<Document>(name);
  return c.findOne(andFilters(scope, { _id }) as Document);
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { name, id } = await ctx.params;
    const policy = policyFor(name);
    const s = await session();

    const scope = await policy.read(s);
    if (scope === null) throw new HttpError(s ? 403 : 401, "You do not have access to that.");

    const doc = await findScoped(name, id, scope);
    if (!doc) throw new HttpError(404, "Not found.");

    let record = sanitiseRead(policy, toRecord(doc)!);
    const expand = new URL(req.url).searchParams.get("expand");
    if (expand) [record] = await expandRecords([record], expand);

    return Response.json(record);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { name, id } = await ctx.params;
    const policy = policyFor(name);
    const s = await session();
    assertAccess(policy.update, s);

    // Reading through the caller's own scope is what enforces ownership here:
    // a non-owner simply cannot resolve the row.
    const scope = await policy.read(s);
    if (scope === null) throw new HttpError(403, "You do not have access to that.");
    const existing = await findScoped(name, id, scope);
    if (!existing) throw new HttpError(404, "Not found.");

    const body = await readBody(req, { collection: name, session: s });
    const update = sanitiseWrite(policy, body, s);
    if (!Object.keys(update).length) {
      return Response.json(sanitiseRead(policy, toRecord(existing)!));
    }

    const c = await coll<Document>(name);
    await c.updateOne({ _id: existing._id }, { $set: { ...update, ...touch() } });

    // e.g. confirming a shipment payment activates its shipment.
    const hooks = hooksFor(name);
    if (hooks.afterUpdate) await hooks.afterUpdate(String(existing._id), update, s);

    const fresh = await c.findOne({ _id: existing._id });
    return Response.json(sanitiseRead(policy, toRecord(fresh)!));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { name, id } = await ctx.params;
    const policy = policyFor(name);
    const s = await session();
    assertAccess(policy.delete, s);

    const scope = await policy.read(s);
    if (scope === null) throw new HttpError(403, "You do not have access to that.");
    const existing = await findScoped(name, id, scope);
    if (!existing) throw new HttpError(404, "Not found.");

    const c = await coll<Document>(name);
    await c.deleteOne({ _id: existing._id });
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
