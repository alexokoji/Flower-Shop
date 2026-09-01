"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-ghost !py-2.5 !px-5">
      <Printer className="size-4" /> Print / save PDF
    </button>
  );
}
