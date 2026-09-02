"use client";

/**
 * Browser-side data client.
 *
 * Deliberately mirrors the slice of the PocketBase SDK the app actually used —
 * `collection(name).getFullList()`, `.getOne()`, `.create()` and friends, plus
 * an `authStore` with the same `.model` / `.onChange()` surface. Keeping the
 * shape means the migration touched the transport, not 79 call sites.
 *
 * Differences that matter:
 *  - There is no auth token here. The session is an httpOnly cookie the browser
 *    attaches automatically, which is why every request sets credentials.
 *  - `filter` strings are parsed by an allowlist server-side (lib/api/filter.ts),
 *    so only the small syntax already in use is accepted.
 */

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  const isForm = init?.body instanceof FormData;
  if (init?.body && !isForm) headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 204) return null as T;

  const text = await res.text();
  const data = text ? safeParse(text) : null;

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in (data as Record<string, unknown>)
        ? String((data as { message: unknown }).message)
        : `Request failed: ${res.status}`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

function safeParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export interface ListOptions {
  filter?: string;
  sort?: string;
  expand?: string;
  /** Comma-separated projection, e.g. "id,name,price". */
  fields?: string;
  perPage?: number;
  page?: number;
  /** Alias for perPage, kept because call sites already use it. */
  limit?: number;
}

function query(opts?: ListOptions): string {
  if (!opts) return "";
  const p = new URLSearchParams();
  for (const key of ["filter", "sort", "expand", "fields"] as const) {
    const v = opts[key];
    if (typeof v === "string" && v) p.set(key, v);
  }
  const perPage = opts.perPage ?? opts.limit;
  if (perPage) p.set("perPage", String(perPage));
  if (opts.page) p.set("page", String(opts.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

function collection(name: string) {
  const base = `/collections/${encodeURIComponent(name)}/records`;
  return {
    async getFullList<T>(opts?: ListOptions): Promise<T[]> {
      const res = await request<ListResult<T>>(
        `${base}${query({ perPage: 500, ...opts })}`
      );
      return res.items ?? [];
    },

    async getList<T>(page = 1, perPage = 30, opts?: ListOptions): Promise<ListResult<T>> {
      return request<ListResult<T>>(`${base}${query({ ...opts, page, perPage })}`);
    },

    async getOne<T>(id: string, opts?: ListOptions): Promise<T> {
      return request<T>(`${base}/${encodeURIComponent(id)}${query(opts)}`);
    },

    /** Throws when nothing matches, matching the SDK's behaviour. */
    async getFirstListItem<T>(filter: string, opts?: ListOptions): Promise<T> {
      const res = await request<ListResult<T>>(
        `${base}${query({ ...opts, filter, perPage: 1 })}`
      );
      const first = res.items?.[0];
      if (!first) throw new ApiError(404, "No matching record.");
      return first;
    },

    async create<T>(data: Record<string, unknown> | FormData): Promise<T> {
      return request<T>(base, {
        method: "POST",
        body: data instanceof FormData ? data : JSON.stringify(data),
      });
    },

    async update<T>(id: string, data: Record<string, unknown> | FormData): Promise<T> {
      return request<T>(`${base}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: data instanceof FormData ? data : JSON.stringify(data),
      });
    },

    async delete(id: string): Promise<void> {
      await request<null>(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Auth store                                                                 */
/* -------------------------------------------------------------------------- */

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "customer" | "admin";
  [key: string]: unknown;
}

type Listener = () => void;

class AuthStore {
  model: AuthUser | null = null;
  /** Truthy once a session is loaded. The real credential is an httpOnly cookie. */
  token = "";
  private listeners = new Set<Listener>();
  private loaded = false;
  private loading: Promise<void> | null = null;

  get isValid() {
    return !!this.model;
  }

  onChange(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  set(user: AuthUser | null) {
    this.model = user;
    this.token = user ? "cookie" : "";
    this.loaded = true;
    this.emit();
  }

  clear() {
    this.set(null);
  }

  /** Fetch the session once per page load; concurrent callers share the promise. */
  async load(force = false): Promise<AuthUser | null> {
    if (this.loaded && !force) return this.model;
    if (this.loading && !force) {
      await this.loading;
      return this.model;
    }
    this.loading = (async () => {
      try {
        const res = await request<{ record: AuthUser | null }>("/auth/session");
        this.set(res.record);
      } catch {
        this.set(null);
      } finally {
        this.loading = null;
      }
    })();
    await this.loading;
    return this.model;
  }

  get ready() {
    return this.loaded;
  }
}

const authStore = new AuthStore();

/* -------------------------------------------------------------------------- */

export function api() {
  return {
    collection,
    authStore,
    files: {
      /**
       * Uploaded files are served by /api/files/<id>/<name>. `query` carries
       * PocketBase-style options such as `{ thumb: "300x300" }`.
       */
      getUrl(record: { id: string }, filename: string, query?: Record<string, string>) {
        if (!filename) return "";
        const qs = query && Object.keys(query).length ? `?${new URLSearchParams(query)}` : "";

        // Uploads are stored as "<gridfs id>/<name>" — that id addresses the
        // file directly, so the owning record's id is not part of the URL.
        const slash = filename.indexOf("/");
        if (slash > 0) {
          const id = filename.slice(0, slash);
          const name = filename.slice(slash + 1);
          return `/api/files/${encodeURIComponent(id)}/${encodeURIComponent(name)}${qs}`;
        }

        return `/api/files/${encodeURIComponent(record.id)}/${encodeURIComponent(filename)}${qs}`;
      },
    },
  };
}

export { authStore, request as apiRequest };
