"use client";

import { create } from "zustand";
import { pb } from "@/lib/pb";
import type { User } from "@/types";

interface WishlistState {
  ids: Set<string>;
  ownerId: string | null;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
  _switchOwner: (userId: string | null) => void;
}

const STORAGE_PREFIX = "fs-wishlist";

function storageKey(userId: string | null): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : `${STORAGE_PREFIX}:guest`;
}

function load(userId: string | null): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(userId: string | null, ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(Array.from(ids)));
}

function currentUserId(): string | null {
  if (typeof window === "undefined") return null;
  const u = pb().authStore.model as User | null;
  return u?.id ?? null;
}

const initialOwner = currentUserId();
const initialIds = new Set(load(initialOwner));

export const useWishlist = create<WishlistState>((set, get) => ({
  ids: initialIds,
  ownerId: initialOwner,

  toggle: (productId) => {
    const next = new Set(get().ids);
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    set({ ids: next });
    save(get().ownerId, next);
  },

  has: (productId) => get().ids.has(productId),

  clear: () => {
    const next = new Set<string>();
    set({ ids: next });
    save(get().ownerId, next);
  },

  _switchOwner: (userId) => {
    if (get().ownerId === userId) return;
    const ids = new Set(load(userId));
    set({ ownerId: userId, ids });
  },
}));

if (typeof window !== "undefined") {
  pb().authStore.onChange(() => {
    useWishlist.getState()._switchOwner(currentUserId());
  });
}