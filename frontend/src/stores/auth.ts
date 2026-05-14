"use client";

import { create } from "zustand";
import { pb } from "@/lib/pb";
import type { User } from "@/types";

interface AuthState {
  token: string;
  user: User | null;
  clear: () => void;
}

function snapshot(): { token: string; user: User | null } {
  if (typeof window === "undefined") return { token: "", user: null };
  return {
    token: pb().authStore.token ?? "",
    user: (pb().authStore.model as User | null) ?? null,
  };
}

// Initialize from pb.authStore so the very first client render has the
// correct values (no timing race with module-level subscriptions).
export const useAuth = create<AuthState>((set) => ({
  ...snapshot(),
  clear: () => {
    pb().authStore.clear();
    set({ token: "", user: null });
  },
}));

// Keep the store synced with pb.authStore on login / logout / token refresh.
if (typeof window !== "undefined") {
  pb().authStore.onChange(() => {
    useAuth.setState(snapshot());
  });
}