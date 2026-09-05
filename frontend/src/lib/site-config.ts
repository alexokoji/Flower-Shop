/**
 * Company details shown across the public site — footer, contact and about.
 *
 * ⚠️  PLACEHOLDERS. The street addresses and phone numbers below are realistic
 * but invented, and the US number uses the 555-01xx range reserved for fiction.
 * Replace every value here with your registered details before trading: this is
 * the only file that needs editing, and publishing a wrong address or an
 * unreachable number is the kind of thing customers and payment providers check.
 */

export interface Office {
  id: string;
  label: string;
  country: string;
  countryCode: string;
  flag: string;
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
    countryCode: "US",
    flag: "🇺🇸",
    lines: ["Xperience Delivery Inc.", "1178 Broadway, Suite 1204", "New York, NY 10001"],
    phone: "+1 (212) 555-0148",
    phoneHref: "+12125550148",
    hours: "Mon–Sat, 9:00–19:00",
    timezone: "ET",
  },
  {
    id: "ch",
    label: "Zürich",
    country: "Switzerland",
    countryCode: "CH",
    flag: "🇨🇭",
    lines: ["Xperience Delivery AG", "Bahnhofstrasse 52", "8001 Zürich"],
    phone: "+41 44 508 21 80",
    phoneHref: "+41445082180",
    hours: "Mon–Sat, 8:00–18:00",
    timezone: "CET",
  },
];

export const CONTACT = {
  general: "hello@xperiencedelivery.shop",
  support: "care@xperiencedelivery.shop",
  events: "events@xperiencedelivery.shop",
  press: "press@xperiencedelivery.shop",
} as const;

/** Founding year, used for the story timeline and the copyright line. */
export const FOUNDED = 2019;
