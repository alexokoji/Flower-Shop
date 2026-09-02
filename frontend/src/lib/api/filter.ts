import { HttpError } from "@/lib/api/guard";

/**
 * A deliberately tiny parser for the PocketBase filter strings the app already
 * uses, e.g.
 *   user = "abc123" && status != "draft"
 *   stock_quantity <= low_stock_threshold && stock_quantity > 0
 *
 * It is an allowlist: anything it does not explicitly understand is rejected
 * with a 400 rather than passed through. That matters because this string comes
 * from the client — a permissive translator would be a query-injection hole
 * (`$where`, `$function`, operator objects).
 *
 * Only `&&` is supported. There is no `||` in the codebase, and adding one
 * without care would let a caller widen a filter the server narrowed.
 */

const CLAUSE = /^\s*([a-z_][a-z0-9_]*)\s*(=|!=|<=|>=|<|>|~)\s*(.+?)\s*$/i;
const IDENT = /^[a-z_][a-z0-9_]*$/i;

const OPS: Record<string, string> = {
  "=": "$eq",
  "!=": "$ne",
  "<": "$lt",
  "<=": "$lte",
  ">": "$gt",
  ">=": "$gte",
};

export function parseFilter(input: string | null | undefined): Record<string, unknown> {
  if (!input || !input.trim()) return {};
  if (input.length > 500) throw new HttpError(400, "Filter is too long.");
  if (input.includes("||")) throw new HttpError(400, "Unsupported filter: || is not allowed.");
  if (input.includes("$")) throw new HttpError(400, "Unsupported filter.");

  const and: Record<string, unknown>[] = [];

  for (const raw of input.split("&&")) {
    const m = raw.match(CLAUSE);
    if (!m) throw new HttpError(400, `Unsupported filter clause: ${raw.trim()}`);

    const [, field, op, rhs] = m;
    const mongoOp = OPS[op];
    if (!mongoOp) {
      // `~` is PocketBase's LIKE. Only ever used for search, handled separately.
      throw new HttpError(400, `Unsupported operator: ${op}`);
    }

    const quoted = rhs.match(/^"(.*)"$/) || rhs.match(/^'(.*)'$/);
    if (quoted) {
      and.push({ [field]: { [mongoOp]: quoted[1] } });
      continue;
    }

    if (rhs === "true" || rhs === "false") {
      and.push({ [field]: { [mongoOp]: rhs === "true" } });
      continue;
    }

    if (rhs === "null" || rhs === '""') {
      and.push({ [field]: { [mongoOp]: rhs === "null" ? null : "" } });
      continue;
    }

    if (/^-?\d+(\.\d+)?$/.test(rhs)) {
      and.push({ [field]: { [mongoOp]: Number(rhs) } });
      continue;
    }

    // Bare identifier on the right-hand side = compare two fields, which needs
    // an aggregation expression (`stock_quantity <= low_stock_threshold`).
    if (IDENT.test(rhs)) {
      and.push({ $expr: { [mongoOp]: [`$${field}`, `$${rhs}`] } });
      continue;
    }

    throw new HttpError(400, `Unsupported filter value: ${rhs}`);
  }

  if (!and.length) return {};
  return and.length === 1 ? and[0] : { $and: and };
}

/** Translate `-created` / `name` into a Mongo sort document. */
export function parseSort(input: string | null | undefined): Record<string, 1 | -1> {
  if (!input || !input.trim()) return { created: -1 };
  const out: Record<string, 1 | -1> = {};
  for (const partRaw of input.split(",")) {
    const part = partRaw.trim();
    if (!part) continue;
    const desc = part.startsWith("-");
    const field = desc ? part.slice(1) : part.replace(/^\+/, "");
    if (!IDENT.test(field)) throw new HttpError(400, `Unsupported sort field: ${field}`);
    out[field] = desc ? -1 : 1;
  }
  return Object.keys(out).length ? out : { created: -1 };
}

/**
 * Merge a client filter with the server's mandatory constraint. The server side
 * always wins: both must hold, so a client filter can only ever narrow.
 */
export function andFilters(
  ...parts: (Record<string, unknown> | undefined | null)[]
): Record<string, unknown> {
  const present = parts.filter((p): p is Record<string, unknown> => !!p && Object.keys(p).length > 0);
  if (!present.length) return {};
  if (present.length === 1) return present[0];
  return { $and: present };
}

/**
 * Translate `fields=id,name,price` into a Mongo projection. `id` maps to `_id`,
 * which Mongo returns anyway. Unknown-looking names are rejected rather than
 * passed through, so this cannot be used to probe the document shape.
 */
export function parseFields(input: string | null | undefined): Record<string, 1> | undefined {
  if (!input || !input.trim()) return undefined;
  const out: Record<string, 1> = {};
  for (const raw of input.split(",")) {
    const field = raw.trim();
    if (!field || field === "id") continue;
    if (!IDENT.test(field)) throw new HttpError(400, `Unsupported field: ${field}`);
    out[field] = 1;
  }
  return Object.keys(out).length ? out : undefined;
}
