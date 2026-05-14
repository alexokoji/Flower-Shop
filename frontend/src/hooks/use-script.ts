"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "ready" | "error";

const cache: Record<string, Status> = {};
const listeners: Record<string, Array<(s: Status) => void>> = {};

function notify(src: string, status: Status) {
  cache[src] = status;
  (listeners[src] ?? []).forEach((cb) => cb(status));
}

export function useScript(src: string | null): Status {
  const [status, setStatus] = useState<Status>(() => (src && cache[src]) || "idle");

  useEffect(() => {
    if (!src) return;
    if (cache[src] === "ready" || cache[src] === "error") {
      setStatus(cache[src]);
      return;
    }
    (listeners[src] ??= []).push(setStatus);

    if (!cache[src]) {
      notify(src, "loading");
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = () => notify(src, "ready");
      el.onerror = () => notify(src, "error");
      document.head.appendChild(el);
    }

    return () => {
      listeners[src] = (listeners[src] ?? []).filter((cb) => cb !== setStatus);
    };
  }, [src]);

  return status;
}