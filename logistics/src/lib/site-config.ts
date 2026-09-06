/**
 * Veloxa company details — footer, contact and about.
 *
 * ⚠️  PLACEHOLDERS. The street addresses and phone numbers are realistic but
 * invented, and the US number uses the 555-01xx range reserved for fiction.
 * Replace them with your registered details before trading; this file is the
 * only place they appear.
 *
 * Kept deliberately in step with the store's own lib/site-config.ts: Veloxa is
 * the logistics arm of the same company, so the cities must not disagree.
 */

export interface Office {
  id: string;
  label: string;
  country: string;
  flag: string;
  role: string;
  lines: string[];
  phone: string;
  /** E.164 form, for tel: links. */
  phoneHref: string;
  hours: string;
  timezone: string;
}

export const OFFICES: Office[] = [
  {
    id: "us",
    label: "New York",
    country: "United States",
    flag: "🇺🇸",
    role: "Global HQ & air hub",
    lines: ["Veloxa Logistics Inc.", "1178 Broadway, Suite 1204", "New York, NY 10001"],
    phone: "+1 (212) 555-0172",
    phoneHref: "+12125550172",
    hours: "Mon–Sat, 7:00–20:00",
    timezone: "ET",
  },
  {
    id: "ch",
    label: "Zürich",
    country: "Switzerland",
    flag: "🇨🇭",
    role: "European hub & customs",
    lines: ["Veloxa Logistics AG", "Bahnhofstrasse 52", "8001 Zürich"],
    phone: "+41 44 508 21 84",
    phoneHref: "+41445082184",
    hours: "Mon–Sat, 7:00–19:00",
    timezone: "CET",
  },
];

export const CONTACT = {
  general: "hello@veloxa.com",
  support: "support@veloxa.com",
  claims: "claims@veloxa.com",
  accounts: "accounts@veloxa.com",
} as const;

export const FOUNDED = 2019;
