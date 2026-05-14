import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatPrice(amount: number, currency = "USD", locale = "en") {
  const key = `${locale}:${currency}`;
  let f = currencyFormatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    });
    currencyFormatters.set(key, f);
  }
  return f.format(amount);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(value: string, n = 120) {
  return value.length > n ? value.slice(0, n - 1) + "…" : value;
}
