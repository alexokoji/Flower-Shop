/**
 * Imagery for the public marketing pages.
 *
 * These are keyword-matched stock photos, kept in one file so swapping in real
 * photography later means editing this list and nothing else. `lock` pins each
 * URL to a specific photo so the page does not reshuffle between renders.
 *
 * Replace the values with your own CDN URLs when the shoot is ready; the host
 * must also be listed in next.config.ts `images.remotePatterns`.
 */

function stock(keywords: string, lock: number, w = 900, h = 1100) {
  return `https://loremflickr.com/${w}/${h}/${keywords}?lock=${lock}`;
}

export const MARKETING_IMAGES = {
  heroPrimary: stock("flower,bouquet", 21, 900, 1200),
  heroSecondary: stock("roses,pink", 34, 700, 700),
  heroTertiary: stock("necklace,jewelry", 12, 700, 700),

  seasonal: stock("flowers,arrangement", 47, 1200, 800),
  jewelry: stock("gold,necklace", 58, 800, 800),
  delivery: stock("parcel,delivery", 63, 800, 800),
  atelier: stock("florist,workshop", 71, 1400, 900),

  flowers: stock("peony,flowers", 88, 800, 1000),
  necklaces: stock("pearl,necklace", 95, 800, 1000),
} as const;

/**
 * A tiny blurred placeholder so images fade in rather than pop. Neutral warm
 * tone, matching the paper background.
 */
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 10"><rect width="8" height="10" fill="#EDE7E1"/></svg>`
  ).toString("base64");
