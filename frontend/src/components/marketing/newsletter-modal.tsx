"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "fs-newsletter-status";
const DELAY_MS = 4000;

type Status = "hidden" | "shown" | "dismissed" | "subscribed";

export function NewsletterModal() {
  const [status, setStatus] = useState<Status>("hidden");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as Status | null;
    if (saved === "dismissed" || saved === "subscribed") return;
    const t = setTimeout(() => setStatus("shown"), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setStatus("dismissed");
    window.localStorage.setItem(STORAGE_KEY, "dismissed");
  }

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // Hook to a real endpoint later — for now just remember dismissal.
    setStatus("subscribed");
    window.localStorage.setItem(STORAGE_KEY, "subscribed");
  }

  if (status === "hidden" || status === "dismissed") return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-label="Newsletter signup"
    >
      <div
        className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={close}
      />
      <div className="relative max-w-md w-full bg-cream-50 dark:bg-ink-950 rounded-2xl shadow-luxe overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <button
          aria-label="Close"
          onClick={close}
          className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-muted"
        >
          <X className="size-4" />
        </button>
        <div
          className="h-32 bg-gradient-to-br from-roseGold-200 via-softPink-100 to-cream-200 dark:from-roseGold-600/40 dark:via-roseGold-500/20 dark:to-ink-900"
          aria-hidden
        />
        <div className="p-8">
          {status === "subscribed" ? (
            <div className="text-center space-y-2">
              <p className="eyebrow">✦ Welcome</p>
              <h2 className="display-serif text-3xl">You're on the list</h2>
              <p className="text-sm text-muted-foreground">
                Look out for your first seasonal letter soon.
              </p>
              <Button onClick={close} variant="outline" className="mt-4">Keep browsing</Button>
            </div>
          ) : (
            <form onSubmit={subscribe} className="space-y-4">
              <div className="text-center">
                <p className="eyebrow">The first to know</p>
                <h2 className="display-serif text-3xl mt-2">Quietly curated, delivered.</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  10% off your first order plus early access to seasonal edits.
                </p>
              </div>
              <Input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-center"
              />
              <Button type="submit" variant="gold" size="lg" className="w-full">
                Subscribe
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}