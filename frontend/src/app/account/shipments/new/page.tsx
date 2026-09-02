"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShipmentForm } from "@/components/account/shipment-form";

export default function NewShipmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/shipments"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" /> All shipments
        </Link>
        <h2 className="display text-xl mt-2">Book a shipment</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the consignment details. Your tracking code is issued as soon as you book.
        </p>
      </div>

      <ShipmentForm />
    </div>
  );
}
