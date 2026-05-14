"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only after the client has hydrated. Use to gate any UI that
 * depends on browser-only state (localStorage, window, etc.) so SSR/CSR
 * HTML matches and React doesn't throw a hydration mismatch error.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}