import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toObjectId } from "@/lib/db/serialize";
import { HttpError } from "@/lib/api/guard";
import type { SessionClaims } from "@/lib/auth/session";

/**
 * Access policy — the replacement for PocketBase's 68 declarative API rules.
 *
 * Everything the old `listRule` / `viewRule` / `createRule` / `updateRule` /
 * `deleteRule` strings expressed lives here, in one table, so the rules stay
 * reviewable side by side instead of being scattered through route handlers.
 *
 * Read access is expressed as a *filter*, never as a post-fetch check: the
 * server's constraint is ANDed into the query, so a row the caller may not see
 * is never loaded in the first place.
 *
 * `deny` is the default. A collection absent from this table is unreachable
 * through the generic /api/collections endpoint.
 */

export type Access = "public" | "auth" | "owner" | "admin" | "none";

export interface Policy {
  /** Filter applied to reads. `null` means "deny outright". */
  read: (s: SessionClaims | null) => Promise<Record<string, unknown> | null>;
  create: Access;
  update: Access;
  delete: Access;
  /** Field holding the owner's user id, for owner-scoped writes. */
  ownerField?: string;
  /** Owner is derived from a parent document instead of a local field. */
  ownerVia?: { collection: string; localField: string };
  /** Never serialised to any client. */
  hidden?: string[];
  /** When set, only these fields may be written by a non-admin. */
  writable?: string[];
}

const ownRows = (s: SessionClaims | null, field = "user") => {
  if (!s) return null;
  return s.role === "admin" ? {} : { [field]: s.uid };
};

/** Ids of the caller's rows in a parent collection, for relation ownership. */
async function parentIds(s: SessionClaims, parent: string): Promise<string[]> {
  const c = await coll(parent);
  const docs = await c.find({ user: s.uid }, { projection: { _id: 1 } }).limit(500).toArray();
  return docs.map((d) => String(d._id));
}

export const POLICIES: Record<string, Policy> = {
  /* ---------------------------------------------------------------- users */
  // Own record only. Listing other users is admin-only.
  [C.users]: {
    read: async (s) => {
      if (!s) return null;
      if (s.role === "admin") return {};
      const _id = toObjectId(s.uid);
      return _id ? { _id } : null;
    },
    create: "none", // registration goes through /api/auth/register
    update: "owner",
    delete: "admin",
    ownerField: "_id",
    hidden: ["password_hash", "reset_token", "verify_token", "reset_expires"],
    writable: ["first_name", "last_name", "phone", "preferred_currency", "locale", "marketing_opt_in"],
  },

  /* ----------------------------------------------------------- categories */
  [C.categories]: {
    read: async (s) => (s?.role === "admin" ? {} : { is_active: true }),
    create: "admin",
    update: "admin",
    delete: "admin",
  },

  /* ------------------------------------------------------------- products */
  [C.products]: {
    read: async (s) =>
      s?.role === "admin" ? {} : { status: { $nin: ["draft", "archived"] } },
    create: "admin",
    update: "admin",
    delete: "admin",
  },

  /* ------------------------------------------------------------ addresses */
  [C.addresses]: {
    read: async (s) => ownRows(s),
    create: "owner",
    update: "owner",
    delete: "owner",
    ownerField: "user",
  },

  /* -------------------------------------------------------- shipping_rates */
  [C.shippingRates]: {
    read: async () => ({ is_active: true }),
    create: "admin",
    update: "admin",
    delete: "admin",
  },

  /* -------------------------------------------------------------- coupons */
  // Public can read active coupons (the checkout validates server-side anyway).
  [C.coupons]: {
    read: async (s) => (s?.role === "admin" ? {} : { is_active: true }),
    create: "admin",
    update: "admin",
    delete: "admin",
  },

  /* --------------------------------------------------------------- orders */
  // Created only by /api/checkout, which recomputes totals server-side.
  [C.orders]: {
    read: async (s) => ownRows(s),
    create: "none",
    update: "admin",
    delete: "admin",
    ownerField: "user",
  },

  /* ----------------------------------------------------- shipment_tracking */
  [C.shipmentTracking]: {
    read: async (s) => {
      if (!s) return null;
      if (s.role === "admin") return {};
      return { order: { $in: await parentIds(s, C.orders) } };
    },
    create: "admin",
    update: "admin",
    delete: "admin",
  },

  /* -------------------------------------------------------------- reviews */
  // Approved reviews are public; a signed-in user also sees their own pending.
  [C.reviews]: {
    read: async (s) => {
      if (s?.role === "admin") return {};
      if (!s) return { status: "approved" };
      return { $or: [{ status: "approved" }, { user: s.uid }] };
    },
    create: "owner",
    update: "owner",
    delete: "owner",
    ownerField: "user",
    // Moderation state is never client-writable.
    writable: ["rating", "title", "body", "product", "photos"],
  },

  /* ------------------------------------------------------------- payments */
  [C.payments]: {
    read: async (s) => ownRows(s),
    create: "none", // webhooks only
    update: "none",
    delete: "admin",
    ownerField: "user",
  },

  /* ------------------------------------------- payment_webhook_events (log) */
  [C.webhookEvents]: {
    read: async (s) => (s?.role === "admin" ? {} : null),
    create: "none",
    update: "none",
    delete: "admin",
  },

  /* ------------------------------------------------------------ wishlists */
  [C.wishlists]: {
    read: async (s) => ownRows(s),
    create: "owner",
    update: "owner",
    delete: "owner",
    ownerField: "user",
  },

  /* ---------------------------------------------------------------- carts */
  [C.carts]: {
    read: async (s) => ownRows(s),
    create: "owner",
    update: "owner",
    delete: "owner",
    ownerField: "user",
  },

  /* ------------------------------------------------------------ shipments */
  [C.shipments]: {
    read: async (s) => ownRows(s),
    create: "owner",
    update: "owner",
    delete: "owner",
    ownerField: "user",
    // Pricing, tracking code and payment state are set by the server only.
    writable: [
      "reference", "service_type", "package_type",
      "sender_name", "sender_company", "sender_phone", "sender_email", "sender_address",
      "sender_city", "sender_state", "sender_postal_code", "sender_country",
      "receiver_name", "receiver_company", "receiver_phone", "receiver_email", "receiver_address",
      "receiver_city", "receiver_state", "receiver_postal_code", "receiver_country",
      "pieces", "weight_kg", "length_cm", "width_cm", "height_cm",
      "contents", "declared_value", "fragile", "insured", "signature_required",
      "currency", "payment_method", "pickup_date", "notes",
    ],
  },

  /* ------------------------------------------------------- shipment_events */
  [C.shipmentEvents]: {
    read: async (s) => {
      if (!s) return null;
      if (s.role === "admin") return {};
      return { shipment: { $in: await parentIds(s, C.shipments) } };
    },
    create: "owner", // validated against the parent shipment in the route
    update: "admin",
    delete: "admin",
    ownerVia: { collection: C.shipments, localField: "shipment" },
  },

  /* ----------------------------------------------------- shipment_payments */
  [C.shipmentPayments]: {
    read: async (s) => ownRows(s),
    create: "none", // started through /api/logistics/pay
    update: "owner", // proof upload only; see writable
    delete: "admin",
    ownerField: "user",
    // A customer may attach evidence but never mark their own payment paid.
    writable: ["proof", "payer_name", "paid_from_bank", "transfer_reference"],
  },

  /* ---------------------------------------------------- logistics_settings */
  // Holds PaymentPoint credentials. Admin-only in every direction; the
  // customer-safe subset is served by /api/logistics/payment-methods.
  [C.logisticsSettings]: {
    read: async (s) => (s?.role === "admin" ? {} : null),
    create: "none",
    update: "admin",
    delete: "none",
    hidden: [],
  },

  /* -------------------------------------------------------- notifications */
  // Per-user notification feed. Scoped by the polymorphic owner columns the
  // account page already queries on.
  [C.notifications]: {
    read: async (s) => {
      if (!s) return null;
      if (s.role === "admin") return {};
      return { notifiable_id: s.uid, notifiable_type: "users" };
    },
    create: "admin",
    update: "owner",
    delete: "owner",
    ownerField: "notifiable_id",
    // A user may only mark a notification read.
    writable: ["read_at"],
  },
};

export function policyFor(name: string): Policy {
  const p = POLICIES[name];
  if (!p) throw new HttpError(404, `Unknown collection: ${name}`);
  return p;
}

/** Enforce a write-access level, throwing 401/403 as appropriate. */
export function assertAccess(access: Access, s: SessionClaims | null): SessionClaims | null {
  switch (access) {
    case "public":
      return s;
    case "auth":
    case "owner":
      if (!s) throw new HttpError(401, "You must be signed in.");
      return s;
    case "admin":
      if (!s) throw new HttpError(401, "You must be signed in.");
      if (s.role !== "admin") throw new HttpError(403, "Administrator access required.");
      return s;
    case "none":
    default:
      throw new HttpError(403, "That action is not available.");
  }
}

/** Drop hidden fields and, for non-admins, anything outside `writable`. */
export function sanitiseWrite(
  policy: Policy,
  body: Record<string, unknown>,
  s: SessionClaims | null
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const hidden = new Set([...(policy.hidden ?? []), "_id", "id", "created", "updated", "role"]);
  const allowed = s?.role === "admin" ? null : policy.writable;

  for (const [k, v] of Object.entries(body)) {
    if (hidden.has(k)) continue;
    if (allowed && !allowed.includes(k)) continue;
    out[k] = v;
  }
  return out;
}

/** Remove hidden fields from a document being serialised out. */
export function sanitiseRead<T extends Record<string, unknown>>(policy: Policy, doc: T): T {
  if (!policy.hidden?.length) return doc;
  const out = { ...doc } as Record<string, unknown>;
  for (const f of policy.hidden) delete out[f];
  return out as T;
}
