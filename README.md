# Xperience Delivery

A luxury e-commerce platform for flowers and fine necklaces — **lightweight, single-binary backend, frontend talks straight to the database**.

```
┌─────────────────────────┐         ┌────────────────────────────┐
│ frontend/ (Next.js 15)  │ ◄────► │ pocketbase/ (one Go binary) │
│  Tailwind + shadcn      │         │  SQLite + auth + storage    │
│  Zustand + RHF + Zod    │         │  JS hooks for webhooks      │
│  PocketBase SDK         │         │  Admin UI at /_/            │
└─────────────────────────┘         └────────────────────────────┘
```

No Laravel, no PHP, no Composer. The frontend calls PocketBase's REST API directly using the `pocketbase` npm SDK. Row-level API rules in PocketBase enforce who can read/write what (customers see their own orders, admins see all, products are public, etc.) — there's no separate API layer to write or maintain.

---

## Architecture decisions

| Decision | Choice |
| --- | --- |
| Backend | **PocketBase** (single Go binary, SQLite, auth, storage, realtime, admin UI) |
| Frontend | Next.js 15 (App Router, TypeScript) |
| State | Zustand (cart, wishlist persisted to `localStorage`); PocketBase SDK manages auth token |
| Forms | React Hook Form + Zod |
| Reference data | Static JSON for countries + currencies (`frontend/src/data/`) — no DB tables |
| Payments | Paystack, Flutterwave, Monnify (Nigerian-first). Public keys in browser; webhooks land in `pb_hooks/main.pb.js` |
| Theme | Cream / rose gold / soft pink / gold / black ink. Cormorant Garamond display + Inter body. Dark mode via `next-themes`. |

---

## Quick start

You need **PHP**? No. **Composer**? No. **MySQL**? No. Just:

- **Node** ≥ 20.11
- A `pocketbase` binary (download once from [pocketbase.io](https://pocketbase.io/docs/), drop into `pocketbase/`)

```bash
# 1. PocketBase (terminal A)
cd pocketbase
# Place the pocketbase / pocketbase.exe binary in this folder, then:
./pocketbase serve            # macOS/Linux
.\pocketbase.exe serve        # Windows
# First run: it auto-applies pb_migrations/, loads pb_hooks/, and asks
# you to create a superuser (admin UI login). The admin UI is at /_/.
```

```bash
# 2. Frontend (terminal B)
cd frontend
npm install
cp .env.example .env.local    # default points at http://localhost:8090
npm run dev                   # http://localhost:3000
```

The migrations seed:
- 12 demo products (6 flowers + 6 necklaces)
- 11 categories
- 13 countries × 2 shipping methods (standard / express)
- 2 demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin (app-level role, not the PocketBase superuser) | `admin@xperiencedelivery.test` | `Admin@1234` |
| Customer | `customer@xperiencedelivery.test` | `Customer@1234` |

> The PocketBase superuser is separate — it can administer collections at `http://localhost:8090/_/`. You'll create it on first launch.

---

## What's a "collection"?

PocketBase calls tables **collections**. The schema is defined as JS files in `pocketbase/pb_migrations/`. Each collection has API rules:

```js
listRule:   "status != \"draft\""            // anyone can list non-draft products
createRule: "@request.auth.role = \"admin\""  // only admins can create products
updateRule: "@request.auth.role = \"admin\""
deleteRule: "@request.auth.role = \"admin\""
```

Rules are evaluated server-side on every request — so the frontend can call `pb.collection('products').create(...)` directly with no fear that customers will sneak through.

### Collections shipped

| Collection | What it stores | Public read? |
| --- | --- | --- |
| `users` (extended) | Customers & admins with `role` field | No (own record only) |
| `categories` | Flower or necklace categories | Yes (`is_active=true`) |
| `products` | All products with type-specific `attributes` JSON | Yes (non-draft) |
| `addresses` | Customer shipping/billing addresses | Owner only |
| `shipping_rates` | Country × method shipping pricing | Yes |
| `coupons` | Promo codes (validated server-side at checkout) | Yes (active) |
| `orders` | Created via `/api/checkout` hook only | Owner only |
| `shipment_tracking` | Timeline rows attached to an order | Owner of the order |
| `reviews` | Per-product reviews with moderation | Approved + own pending |
| `payments` | Created only by webhook hooks | Owner only |
| `payment_webhook_events` | Idempotent log of webhook deliveries | Admin only |
| `wishlists` | User ↔ product favorites | Owner only |

---

## Custom routes (PocketBase JS hooks)

Defined in `pocketbase/pb_hooks/main.pb.js`. These give us server-side logic for the few places where the browser cannot be trusted (price tampering, signed webhooks).

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/api/checkout` | Recomputes totals server-side, validates coupon + shipping country, snapshots line items, creates the `orders` record. |
| POST | `/api/shipping/estimate` | Returns a shipping quote without creating an order. |
| POST | `/api/webhooks/paystack` | Verifies HMAC-SHA512 signature, marks order paid, writes `payments` row. |
| POST | `/api/webhooks/flutterwave` | Verifies `verif-hash` header, same effect. |
| POST | `/api/webhooks/monnify` | Verifies HMAC-SHA512 signature, same effect. |

Webhook secrets are read from env vars at startup:

```bash
# Windows PowerShell
$env:PAYSTACK_SECRET_KEY="sk_test_..."
$env:PAYSTACK_WEBHOOK_SECRET="..."
$env:FLUTTERWAVE_SECRET_KEY="..."
$env:FLUTTERWAVE_WEBHOOK_HASH="..."
$env:MONNIFY_SECRET_KEY="..."
$env:MONNIFY_WEBHOOK_SECRET="..."
$env:FRONTEND_URL="http://localhost:3000"
.\pocketbase.exe serve
```

See `pocketbase/.env.example` for the full list.

---

## Frontend file map

```
frontend/src/
├── app/
│   ├── (auth)/                  # split-screen auth shell
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── account/                 # protected customer dashboard
│   │   ├── layout.tsx           # auth gate
│   │   ├── page.tsx             # overview
│   │   ├── addresses/
│   │   ├── settings/
│   │   ├── orders/, wishlist/, payments/, notifications/
│   └── page.tsx                 # home — hero, categories, featured rails…
├── lib/
│   ├── pb.ts                    # PocketBase SDK singleton + fileUrl helper
│   ├── auth.ts                  # register/login/logout/forgot/reset/verify
│   ├── catalog.ts               # listProducts, featuredProducts, productBySlug…
│   ├── errors.ts                # extractError() normalizer
│   └── utils.ts                 # cn(), formatPrice()
├── stores/
│   ├── auth.ts                  # mirrors pb.authStore
│   ├── cart.ts                  # localStorage-only cart
│   └── wishlist.ts              # localStorage-only wishlist
├── components/
│   ├── layout/                  # header, footer, theme provider, toggle
│   ├── home/                    # hero, category showcase, featured rail…
│   ├── shop/                    # product-card, skeleton
│   ├── account/                 # account-shell sidebar
│   ├── auth/                    # form error display
│   └── ui/                      # button, input, label (shadcn)
├── data/
│   ├── countries.json           # static — 28 entries
│   ├── currencies.json          # static — 10 entries
│   └── index.ts                 # COUNTRIES, CURRENCIES, countryByIso2()
└── types/
    └── index.ts                 # all PocketBase record types
```

---

## Theme tokens

CSS variables in [frontend/src/app/globals.css](frontend/src/app/globals.css), exposed via [tailwind.config.ts](frontend/tailwind.config.ts):

```
cream      — base surface
roseGold   — primary accent
softPink   — secondary accent
gold       — discount badges
ink        — text + contrast
```

Utilities: `btn-gold`, `btn-outline-gold`, `surface-luxe`, `display-serif`, `eyebrow`.

---

## Image storage

Product images, category banners, and review photos are uploaded directly to PocketBase as files attached to records. PocketBase stores them on local disk under `pocketbase/pb_data/storage/` and serves them through its own URL — the frontend builds image URLs with:

```ts
import { fileUrl } from "@/lib/pb";
fileUrl({ id, collectionId }, "the-filename.jpg", { thumb: "600x750" });
```

PocketBase resizes on the fly when you pass `thumb`. Switching to S3 later is one config edit in the admin UI — no code change needed.

---

## Phases & roadmap

| Phase | Module | Status |
| --- | --- | --- |
| 1 | Foundation (schema, models, theme, scaffolding) | ✅ Complete |
| 2 | Auth (register, login, forgot, verify, profile, addresses) | ✅ Complete |
| 3 | Catalog admin (CRUD via PocketBase admin UI or custom pages) | ⏳ Admin UI ready, custom admin pages next |
| 4 | Cart & wishlist (already localStorage; server sync optional) | ✅ localStorage works |
| 5 | Checkout (calls `/api/checkout` PB hook) | 🟡 PB hook ready, frontend page next |
| 6 | Payments (Paystack / Flutterwave / Monnify webhooks) | 🟡 Webhooks ready, frontend init flow next |
| 7 | Orders & tracking (timeline, admin actions, emails) | ⏳ Schema ready |
| 8 | Admin dashboard pages | ⏳ Use `/_/` for now |
| 9 | Reviews + SEO + polish (sitemap, OG, structured data, animations) | ⏳ |

---

## Working endpoints (Phases 1–2)

**PocketBase REST** — automatically generated for every collection at `http://localhost:8090/api/collections/{name}/records`. Documented at `http://localhost:8090/_/#/docs`. The frontend uses the JS SDK (`pb.collection(name).getList(...)`) so you rarely call the raw URL.

**Custom hooks** — `/api/checkout`, `/api/shipping/estimate`, `/api/webhooks/paystack|flutterwave|monnify`.

**Auth (built into PocketBase, used via SDK)**:

| SDK call | Purpose |
| --- | --- |
| `pb.collection("users").create({...})` | Register |
| `pb.collection("users").authWithPassword(email, pw)` | Login |
| `pb.authStore.clear()` | Logout |
| `pb.collection("users").authRefresh()` | Validate / refresh session |
| `pb.collection("users").requestPasswordReset(email)` | Forgot password |
| `pb.collection("users").confirmPasswordReset(token, pw, pwConfirm)` | Reset password |
| `pb.collection("users").requestVerification(email)` | Send verification email |
| `pb.collection("users").confirmVerification(token)` | Confirm email |

PocketBase persists the token to localStorage automatically; our [stores/auth.ts](frontend/src/stores/auth.ts) is a thin Zustand mirror so React components re-render on auth changes.

---

## Common commands

```bash
# PocketBase
./pocketbase serve                       # start API + admin UI
./pocketbase migrate up                  # re-apply migrations (also runs on `serve`)
./pocketbase migrate down 1              # rewind one
./pocketbase superuser create me@x.test  # create another superuser
rm -rf pb_data                           # reset everything

# Frontend
npm run dev
npm run build
npm run lint
npm run typecheck
```

---

## Deploying

**Frontend** → Vercel (free tier, zero config for Next.js). Set `NEXT_PUBLIC_PB_URL` to your PocketBase URL.

**PocketBase** — pick a guide:

- **[pocketbase/DEPLOY.md](pocketbase/DEPLOY.md)** → **PocketHost.io** (managed, free tier, ~5 min setup). Recommended.
- **[pocketbase/DEPLOY-FLY.md](pocketbase/DEPLOY-FLY.md)** → **Fly.io** (DIY, Dockerfile + `fly.toml` included, ~$2.50/mo under their Hobby credit).
- Anywhere else that runs a single Linux binary works too — `scp` the PocketBase binary + `pb_migrations/` + `pb_hooks/`, run behind nginx/Caddy with TLS.

Persistent storage for `pb_data/` is the only hard requirement (it holds the SQLite DB + uploaded files). Daily backups: just copy that directory.

---

## Next: Phase 3

Catalog admin. Two paths from here:

1. **Use the PocketBase admin UI** at `/_/` for product/category CRUD — fastest, zero frontend code needed, supports drag/drop image upload natively.
2. **Build a styled `/admin` section** in Next.js — matches your design language but requires reimplementing forms.

You can stay on option 1 for the whole project if the team is fine using PocketBase's UI for management. Say the word and I'll wire up option 2.
