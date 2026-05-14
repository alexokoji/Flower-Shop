"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = resolvedTheme === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="p-2 hover:text-roseGold transition-colors"
    >
      {mounted ? (dark ? <Sun className="size-5" /> : <Moon className="size-5" />) : <Moon className="size-5" />}
    </button>
  );
}
