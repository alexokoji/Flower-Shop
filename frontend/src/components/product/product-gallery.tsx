"use client";

import Image from "next/image";
import { useState, useRef, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface Props {
  fullUrls: string[];
  thumbUrls: string[];
  alt: string;
}

export function ProductGallery({ fullUrls, thumbUrls, alt }: Props) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const ref = useRef<HTMLDivElement>(null);

  if (fullUrls.length === 0) {
    return (
      <div className="aspect-square w-full rounded-3xl bg-gradient-to-br from-cream-200 via-softPink-100 to-roseGold-100" />
    );
  }

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  function go(d: number) {
    setIdx((i) => (i + d + fullUrls.length) % fullUrls.length);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-3">
      <div className="order-2 md:order-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:max-h-[600px]">
        {thumbUrls.map((t, i) => (
          <button
            key={t + i}
            onClick={() => setIdx(i)}
            className={cn(
              "relative shrink-0 size-16 md:size-20 rounded-lg overflow-hidden border-2 transition-colors",
              idx === i ? "border-roseGold" : "border-transparent hover:border-border"
            )}
          >
            <Image src={t} alt={`${alt} thumbnail ${i + 1}`} fill className="object-cover" sizes="80px" />
          </button>
        ))}
      </div>

      <div className="order-1 md:order-2 relative">
        <div
          ref={ref}
          className="relative aspect-square w-full rounded-3xl overflow-hidden bg-cream-100 cursor-zoom-in"
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={onMove}
        >
          <Image
            src={fullUrls[idx]}
            alt={alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-300",
              zoom ? "scale-150" : "scale-100"
            )}
            style={zoom ? { transformOrigin: `${pos.x}% ${pos.y}%` } : undefined}
          />
          <div className="absolute top-3 right-3 size-9 grid place-items-center rounded-full bg-cream-50/80 backdrop-blur text-ink-900 opacity-70">
            <ZoomIn className="size-4" />
          </div>
          {fullUrls.length > 1 && (
            <>
              <button
                aria-label="Previous image"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 grid place-items-center rounded-full bg-cream-50/80 backdrop-blur hover:bg-cream-50"
              ><ChevronLeft className="size-4" /></button>
              <button
                aria-label="Next image"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-9 grid place-items-center rounded-full bg-cream-50/80 backdrop-blur hover:bg-cream-50"
              ><ChevronRight className="size-4" /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}