"use client";

import { useEffect, useState } from "react";
import { authStore } from "@/lib/api/client";
import type { User } from "@/types";

/**
 * Wrapper for the /account pages.
 *
 * Navigation used to live here as a second sidebar; the app shell now owns it,
 * so this only supplies the page container and greeting. Access is enforced in
 * middleware, which is why there is no auth gate left in this component.
 */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const apply = () => setUser((authStore.model as User | null) ?? null);
    apply();
    const off = authStore.onChange(apply);
    void authStore.load();
    return off;
  }, []);

  return (
    <div className="container-page py-8 lg:py-12">
      <header className="mb-8">
        <p className="eyebrow">Your account</p>
        <h1 className="display mt-2 text-display-md">
          {user ? `Welcome, ${user.first_name}` : "Welcome"}
        </h1>
      </header>
      {children}
    </div>
  );
}
