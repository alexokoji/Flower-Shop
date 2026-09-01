"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { normaliseCode } from "@/lib/shipment-meta";

export function TrackForm({
  size = "lg",
  initial = "",
  autoFocus = false,
}: {
  size?: "lg" | "sm";
  initial?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normaliseCode(code);
    if (clean.length < 6) {
      setError("Enter the full tracking number, e.g. VLX-4K7M-2Q9R.");
      return;
    }
    setError("");
    setBusy(true);
    router.push(`/track/${encodeURIComponent(clean)}`);
  };

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={`flex flex-col sm:flex-row gap-3 ${
          size === "lg" ? "" : "sm:gap-2"
        }`}
      >
        <div className="relative flex-1">
          <Search className="size-5 absolute left-5 top-1/2 -translate-y-1/2 text-mist-400" />
          <input
            value={code}
            autoFocus={autoFocus}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VLX-4K7M-2Q9R"
            aria-label="Tracking number"
            spellCheck={false}
            className={`field pl-14 uppercase tracking-wider ${
              size === "sm" ? "!h-12 !text-sm" : ""
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className={`btn-primary shrink-0 ${size === "lg" ? "!h-14 !px-8" : "!h-12"}`}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <>Track <ArrowRight className="size-4" /></>}
        </button>
      </div>
      {error && <p className="text-sm text-amber-300 mt-3 pl-2">{error}</p>}
    </form>
  );
}
