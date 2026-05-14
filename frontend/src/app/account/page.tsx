"use client";

import Link from "next/link";
import { Package, Heart, MapPin, Bell } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useWishlist } from "@/stores/wishlist";

export default function AccountOverviewPage() {
  const { user } = useSession();
  const wishlistCount = useWishlist((s) => s.ids.size);

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : "—";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile href="/account/orders" icon={Package} label="Orders" value="0" hint="View history" />
        <Tile href="/account/wishlist" icon={Heart} label="Wishlist" value={String(wishlistCount)} hint="Saved pieces" />
        <Tile href="/account/addresses" icon={MapPin} label="Addresses" value="—" hint="Manage" />
        <Tile href="/account/notifications" icon={Bell} label="Unread" value="0" hint="Latest updates" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <article className="surface-luxe p-6">
          <h2 className="display-serif text-2xl">Continue shopping</h2>
          <p className="text-sm text-muted-foreground mt-2">
            New season blooms and freshly tied bouquets are waiting in the studio.
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/shop?type=flower" className="btn-gold !text-xs">Shop flowers</Link>
            <Link href="/shop?type=necklace" className="btn-outline-gold !text-xs">Shop necklaces</Link>
          </div>
        </article>
        <article className="surface-luxe p-6">
          <h2 className="display-serif text-2xl">Your details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd>{fullName}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd className="truncate">{user?.email ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd>{user?.phone ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Currency</dt><dd>{user?.preferred_currency ?? "USD"}</dd></div>
          </dl>
          <div className="mt-4">
            <Link href="/account/settings" className="text-sm underline underline-offset-4 hover:text-roseGold">
              Update details →
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}

function Tile({
  href,
  icon: Icon,
  label,
  value,
  hint,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link href={href} className="surface-luxe p-5 block hover:shadow-luxe transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="display-serif text-3xl mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
        <Icon className="size-5 text-roseGold" />
      </div>
    </Link>
  );
}