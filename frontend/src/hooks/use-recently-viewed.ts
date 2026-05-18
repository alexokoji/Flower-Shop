"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "fs-recently-viewed";
const MAX = 12;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
}

/** Tracks recently viewed products in localStorage. Call `record(id)` after the
 *  user views a product. `ids` is the list of recent ids, most recent first. */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => { setIds(read()); }, []);

  const record = useCallback((productId: string) => {
    const next = [productId, ...read().filter((x) => x !== productId)].slice(0, MAX);
    write(next);
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
  }, []);

  return { ids, record, clear };
}