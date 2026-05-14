import PocketBase from "pocketbase";

const PB_URL = (process.env.NEXT_PUBLIC_PB_URL ?? "http://localhost:8090").replace(/\/+$/, "");

// Singleton client. On the browser, the SDK syncs auth state to localStorage
// automatically via pb.authStore â€” no Zustand persistence needed for the token.
let _pb: PocketBase | null = null;

export function pb(): PocketBase {
  if (typeof window === "undefined") {
    // Per-request instance on the server to avoid cross-user auth leaks during SSR.
    return new PocketBase(PB_URL);
  }
  if (!_pb) _pb = new PocketBase(PB_URL);
  return _pb;
}

/** Build a public file URL from a record + filename. */
export function fileUrl(record: { id: string; collectionId?: string; collectionName?: string }, filename: string, query?: Record<string, string>) {
  return pb().files.getUrl(record as never, filename, query);
}

/** Call a custom route registered in pocketbase/pb_hooks/main.pb.js. */
export async function pbCall<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = `${PB_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const token = pb().authStore.token;
  if (token) headers.set("Authorization", token);

  const res = await fetch(url, { ...init, headers, credentials: "include" });
  const text = await res.text();
  const data = text ? safeParse(text) : null;

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in (data as Record<string, unknown>)
        ? String((data as { message: unknown }).message)
        : `Request failed: ${res.status}`;
    throw new PbError(res.status, message, data);
  }
  return data as T;
}

export class PbError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function safeParse(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}
