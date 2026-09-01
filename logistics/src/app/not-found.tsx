import Link from "next/link";
import { Compass } from "lucide-react";
import { TrackForm } from "@/components/track-form";

export default function NotFound() {
  return (
    <div className="container-wide py-24 lg:py-32">
      <div className="panel p-10 lg:p-14 max-w-2xl mx-auto text-center">
        <span className="inline-grid place-items-center size-14 rounded-full bg-signal-500/15 text-signal-300">
          <Compass className="size-6" />
        </span>
        <h1 className="display text-3xl text-white mt-5">This page took a wrong turn</h1>
        <p className="text-sm text-mist-300 mt-3">
          The page you were looking for is not here. If you were tracking a shipment, enter the number
          below.
        </p>
        <div className="mt-8 text-left">
          <TrackForm size="sm" />
        </div>
        <Link href="/" className="text-sm text-signal-300 hover:text-white inline-block mt-6">
          ← Back to the homepage
        </Link>
      </div>
    </div>
  );
}
