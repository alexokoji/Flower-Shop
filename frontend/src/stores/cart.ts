"use client";

import { create } from "zustand";
import { pb } from "@/lib/pb";
import type { Product, User, PbRecord } from "@/types";

export function effectivePrice(p: Pick<Product, "price" | "sale_price">): number {
  return p.sale_price && p.sale_price > 0 && p.sale_price < p.price ? p.sale_price : p.price;
}

export interface LocalCartItem {
  product_id: string;
  name: string;
  slug: string;
  currency: string;
  unit_price: number;
  image_url: string | null;
  image_filename: string | null;
  collection_id: string;
  quantity: number;
}

interface PersistedShape {
  items: LocalCartItem[];
  couponCode: string | null;
}

interface RemoteCart extends PbRecord {
  user: string;
  currency: string;
  coupon_code: string;
  items: LocalCartItem[];
}

interface CartState extends PersistedShape {
  currency: string;
  ownerId: string | null;
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setCoupon: (code: string | null) => void;
  setCurrency: (currency: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
  /** Internal: called when the logged-in user changes. */
  _switchOwner: (userId: string | null) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
const GUEST_KEY = "fs-cart:guest";

function loadGuest(): PersistedShape {
  if (typeof window === "undefined") return { items: [], couponCode: null };
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    if (!raw) return { items: [], couponCode: null };
    const parsed = JSON.parse(raw) as PersistedShape;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      couponCode: typeof parsed.couponCode === "string" ? parsed.couponCode : null,
    };
  } catch {
    return { items: [], couponCode: null };
  }
}

function saveGuest(state: PersistedShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_KEY, JSON.stringify(state));
}

async function loadRemote(userId: string): Promise<{ record: RemoteCart | null; state: PersistedShape }> {
  try {
    const record = await pb().collection("carts").getFirstListItem<RemoteCart>(`user = "${userId}"`);
    return {
      record,
      state: {
        items: Array.isArray(record.items) ? record.items : [],
        couponCode: record.coupon_code || null,
      },
    };
  } catch {
    return { record: null, state: { items: [], couponCode: null } };
  }
}

// Map of userId -> remote record id (so we don't refetch on every save).
const remoteRecordCache = new Map<string, string>();

let writeTimer: ReturnType<typeof setTimeout> | null = null;

async function saveRemote(userId: string, state: PersistedShape, currency: string) {
  try {
    let recordId = remoteRecordCache.get(userId);
    if (!recordId) {
      try {
        const found = await pb().collection("carts").getFirstListItem<RemoteCart>(`user = "${userId}"`);
        recordId = found.id;
      } catch {
        const created = await pb().collection("carts").create<RemoteCart>({
          user: userId,
          currency,
          coupon_code: state.couponCode ?? "",
          items: state.items,
        });
        recordId = created.id;
      }
      remoteRecordCache.set(userId, recordId);
    }
    await pb().collection("carts").update(recordId, {
      currency,
      coupon_code: state.couponCode ?? "",
      items: state.items,
    });
  } catch (err) {
    // Network errors here just mean the next mutation will retry.
    console.warn("[cart] failed to sync to PocketBase:", err);
  }
}

function scheduleRemoteSave(userId: string, state: PersistedShape, currency: string) {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => saveRemote(userId, state, currency), 400);
}

function mergeItems(a: LocalCartItem[], b: LocalCartItem[]): LocalCartItem[] {
  const map = new Map<string, LocalCartItem>();
  for (const item of a) map.set(item.product_id, { ...item });
  for (const item of b) {
    const existing = map.get(item.product_id);
    if (existing) existing.quantity += item.quantity;
    else map.set(item.product_id, { ...item });
  }
  return Array.from(map.values());
}

function currentUserId(): string | null {
  if (typeof window === "undefined") return null;
  const u = pb().authStore.model as User | null;
  return u?.id ?? null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
const initialOwner = currentUserId();
// On first SSR/CSR boot, we don't await the remote fetch — we hydrate from
// the guest cart immediately and let _switchOwner replace it asynchronously.
const initial = initialOwner ? { items: [], couponCode: null } : loadGuest();

export const useCart = create<CartState>((set, get) => {
  function persist(items: LocalCartItem[], couponCode: string | null) {
    const owner = get().ownerId;
    if (owner) {
      scheduleRemoteSave(owner, { items, couponCode }, get().currency);
    } else {
      saveGuest({ items, couponCode });
    }
  }

  return {
    items: initial.items,
    couponCode: initial.couponCode,
    currency: process.env.NEXT_PUBLIC_BASE_CURRENCY ?? "USD",
    ownerId: initialOwner,

    add: (product, quantity = 1) => {
      const items = [...get().items];
      const existing = items.find((i) => i.product_id === product.id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, product.stock_quantity || 99);
      } else {
        items.push({
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          currency: product.currency,
          unit_price: effectivePrice(product),
          image_url: product.image_urls?.[0] ?? null,
          image_filename: product.images?.[0] ?? null,
          collection_id: product.collectionId,
          quantity,
        });
      }
      set({ items });
      persist(items, get().couponCode);
    },

    remove: (productId) => {
      const items = get().items.filter((i) => i.product_id !== productId);
      set({ items });
      persist(items, get().couponCode);
    },

    setQuantity: (productId, quantity) => {
      const items = get()
        .items.map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, quantity) } : i))
        .filter((i) => i.quantity > 0);
      set({ items });
      persist(items, get().couponCode);
    },

    setCoupon: (code) => {
      set({ couponCode: code });
      persist(get().items, code);
    },

    setCurrency: (currency) => set({ currency }),

    clear: () => {
      set({ items: [], couponCode: null });
      persist([], null);
    },

    count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
    subtotal: () => get().items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0),

    _switchOwner: async (newUserId) => {
      const prev = get().ownerId;
      if (prev === newUserId) {
        // Hydrate now in case we mounted before pb.authStore was ready.
        if (newUserId) {
          const { record, state } = await loadRemote(newUserId);
          if (record) remoteRecordCache.set(newUserId, record.id);
          set({ items: state.items, couponCode: state.couponCode });
        }
        return;
      }

      // Flush any pending writes before switching.
      if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }

      const carriedOver = get().items; // current in-memory cart

      if (newUserId) {
        // Logging in: load server cart + merge any anonymous items we had.
        const { record, state: serverState } = await loadRemote(newUserId);
        if (record) remoteRecordCache.set(newUserId, record.id);
        const merged = prev === null && carriedOver.length
          ? mergeItems(serverState.items, carriedOver)
          : serverState.items;
        set({
          ownerId: newUserId,
          items: merged,
          couponCode: serverState.couponCode ?? get().couponCode,
        });
        // Clear the guest cart now that we've absorbed it.
        if (prev === null) saveGuest({ items: [], couponCode: null });
        // Persist the merge back.
        scheduleRemoteSave(newUserId, { items: merged, couponCode: get().couponCode }, get().currency);
      } else {
        // Logging out: drop the in-memory user cart, load the guest one.
        remoteRecordCache.clear();
        const guest = loadGuest();
        set({ ownerId: null, items: guest.items, couponCode: guest.couponCode });
      }
    },
  };
});

// On boot, if already authenticated, fetch the remote cart asynchronously.
if (typeof window !== "undefined") {
  if (initialOwner) {
    useCart.getState()._switchOwner(initialOwner);
  }
  pb().authStore.onChange(() => {
    useCart.getState()._switchOwner(currentUserId());
  });
}