# Veloxa Logistics

The public tracking site for shipments booked in the Xperience Delivery customer dashboard.
Separate brand, separate domain (`veloxa.com`), **same MongoDB database**, read
through the store's public API.

```
frontend/  (xperiencedelivery.shop)     logistics/  (veloxa.com)
  book + pay for a shipment               track a shipment
  update its status                       view a shared receipt
  owns the API + database                 read-only, no login
        \                                        /
         \___ Next.js API ──► MongoDB Atlas ___/
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

No login, no booking, no writes. Veloxa reads three public routes on the store:

- `GET /api/track/{code}` — masked names, no street addresses, no prices
- `GET /api/receipt/{code}?token=…` — full record, gated by the shipment's random token
- `POST /api/logistics/quote` — prices a hypothetical shipment, creates nothing

Shipments are created and updated by their owner in the store's dashboard at
`/account/shipments`.

## Running it

```bash
cd logistics
npm install
cp .env.example .env.local     # points at http://localhost:3000
npm run dev                    # http://localhost:3001
```

The store must be running (`cd frontend && npm run dev`) for tracking to resolve —
it owns the database connection.

## Design system

Deliberately unlike the store's cream-and-rose-gold: deep navy (`navy-950`), signal blue
(`signal-500`) and velocity cyan (`velocity-400`), Space Grotesk display over Inter body.
Dark-only — `globals.css` sets `color-scheme: dark` and the palette is defined in
`tailwind.config.ts`.

## Deploying

Point `veloxa.com` at this app and set:

```
NEXT_PUBLIC_API_URL=https://xperiencedelivery.shop   # the store's API origin
NEXT_PUBLIC_SITE_URL=https://veloxa.com
```

Set `NEXT_PUBLIC_LOGISTICS_URL=https://veloxa.com` in the store's `frontend/.env` so the
tracking and receipt links it generates point here.

These values live in `.env.production`, committed on purpose: both are
`NEXT_PUBLIC_*`, so Next.js inlines them into the browser bundle and neither is
a secret.
