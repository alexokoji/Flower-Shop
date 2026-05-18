"use client";

import { useRouter } from "next/navigation";
import { User, LogIn, UserPlus, Package, Heart, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/stores/auth";
import { logout } from "@/lib/auth";
import { toast } from "sonner";

export function AccountMenu() {
  const router = useRouter();
  const user = useAuth((s) => s.user);

  function onSignOut() {
    logout();
    toast.success("Signed out.");
    router.replace("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="p-2 hover:text-roseGold focus-visible:outline-none focus-visible:text-roseGold"
      >
        <User className="size-5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {user ? (
          <>
            <DropdownMenuLabel className="!normal-case !tracking-normal text-foreground">
              <span className="block text-xs font-normal text-muted-foreground">Signed in as</span>
              <span className="block text-sm font-medium truncate">{user.first_name} {user.last_name}</span>
              <span className="block text-[11px] text-muted-foreground truncate">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/account")}>
              <User /> Overview
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/account/orders")}>
              <Package /> Orders
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/account/wishlist")}>
              <Heart /> Wishlist
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/account/settings")}>
              <Settings /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSignOut} className="text-muted-foreground">
              <LogOut /> Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => router.push("/login")}>
              <LogIn /> Sign in
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/register")}>
              <UserPlus /> Create account
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}