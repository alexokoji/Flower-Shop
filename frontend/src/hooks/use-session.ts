"use client";

import { useEffect, useState } from "react";
import { pb } from "@/lib/pb";
import { fetchMe } from "@/lib/auth";
import type { User } from "@/types";

interface SessionState {
  user: User | null;
  token: string;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    user: null,
    token: "",
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const apply = () => {
      const token = pb().authStore.token ?? "";
      const user = (pb().authStore.model as User | null) ?? null;
      setState({ token, user, isAuthenticated: !!token, isLoading: false });
    };
    apply();
    const off = pb().authStore.onChange(apply);
    return off;
  }, []);

  // Background-refresh the profile when we have a token.
  useEffect(() => {
    if (state.token) {
      fetchMe().catch(() => { /* fetchMe clears the store on 401 */ });
    }
  }, [state.token]);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    refetch: fetchMe,
  };
}