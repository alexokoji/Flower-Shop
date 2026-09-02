"use client";

import { create } from "zustand";
import { authStore } from "@/lib/api/client";
import type { User } from "@/types";

interface AuthState {
  token: string;
  user: User | null;
  /** False until the session cookie has been checked with the server. */
  ready: boolean;
  clear: () => void;
}

function snapshot() {
  return {
    token: authStore.token,
    user: (authStore.model as User | null) ?? null,
    ready: authStore.ready,
  };
}

export const useAuth = create<AuthState>((set) => ({
  ...snapshot(),
  clear: () => {
    authStore.clear();
    set({ token: "", user: null, ready: true });
  },
}));

if (typeof window !== "undefined") {
  authStore.onChange(() => useAuth.setState(snapshot()));
  // The session lives in an httpOnly cookie, so unlike the old localStorage
  // token it cannot be read synchronously — resolve it once on load.
  void authStore.load();
}
