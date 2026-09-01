# Veloxa Logistics

The public tracking site for shipments booked in the Xperience Delivery customer dashboard.
Separate brand, separate domain (`veloxa.com`), **same PocketBase database**.

```
frontend/  (xperiencedelivery.com)      logistics/  (veloxa.com)
  book + pay for a shipment               track a shipment
  update its status                       view a shared receipt
        \                                        /
         \______  pocketbase/ (one database) ___/
```

## What lives here

| Route | What it is |
| --- | --- |
| `/` | Marketing homepage — hero with tracking box, services, network, CTA |
| `/track` | Tracking landing page + FAQ |
| `/track/[code]` | Live tracking result: status rail, timeline, sanitised details |
| `/receipt/[code]?token=…` | Full shareable receipt (printable) |
| `/services`, `/network`, `/about`, `/contact` | Marketing pages |
| `/terms`, `/privacy` | Legal |

## What does NOT live here

No login, no booking, no writes. Veloxa reads three public PocketBase routes:

- `GET /api/track/{code}` — masked names, no street addresses, no prices
- `GET /api/receipt/{code}?token=…` — full record, gated by the shipment's random token
- `POST /api/logistics/quote` — prices a hypothetical shipment, creates nothing

Shipments are created and updated by their owner in the store's dashboard at
`/account/shipments`.

## Running it

```bash
cd logistics
npm install
cp .env.example .env.local     # points at http://localhost:8090
npm run dev                    # http://localhost:3001
```

PocketBase must be running (`cd pocketbase && ./pocketbase serve`) for tracking to resolve.

## Design system

Deliberately unlike the store's cream-and-rose-gold: deep navy (`navy-950`), signal blue
(`signal-500`) and velocity cyan (`velocity-400`), Space Grotesk display over Inter body.
Dark-only — `globals.css` sets `color-scheme: dark` and the palette is defined in
`tailwind.config.ts`.

## Deploying

Point `veloxa.com` at this app and set:

```
NEXT_PUBLIC_PB_URL=https://api.xperiencedelivery.com   # the PocketBase origin
NEXT_PUBLIC_SITE_URL=https://veloxa.com
```

Set `NEXT_PUBLIC_LOGISTICS_URL=https://veloxa.com` in the store's `frontend/.env` so the
tracking and receipt links it generates point here.
