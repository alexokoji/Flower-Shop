# PocketBase → MongoDB migration

The backend is no longer PocketBase. MongoDB Atlas holds the data, and the API
that used to come free with PocketBase now lives in `frontend/src/app/api`.

```
before                                 after
┌────────────┐   direct    ┌────────┐  ┌────────────┐  fetch   ┌──────────────┐  driver  ┌─────────┐
│  browser   │ ──────────► │   PB   │  │  browser   │ ───────► │ Next.js API  │ ───────► │ MongoDB │
└────────────┘   SDK+JWT   └────────┘  └────────────┘  cookie  │ route handlers│  (TCP)   │  Atlas  │
                                                                └──────────────┘          └─────────┘
```

The middle column is the whole point: **a browser cannot talk to MongoDB.** The
driver is a TCP client and the connection string is an admin credential, so
every query now goes through a server-side route that authenticates the caller
first.

---

## What replaced what

| PocketBase gave us | Now |
| --- | --- |
| SQLite + collections | MongoDB collections (`src/lib/db/collections.ts`) |
| 68 declarative API rules | `src/lib/api/policy.ts` — one table, same rules |
| Auth (JWT in localStorage) | bcrypt + JWT in an **httpOnly cookie** (`src/lib/auth/session.ts`) |
| 12 JS hook routes | Route handlers under `src/app/api` |
| Record hooks (pricing, tracking codes) | `src/lib/api/hooks.ts` |
| File storage on disk | GridFS (`src/lib/db/files.ts`), served by `/api/files/…` |
| Admin UI at `/_/` | The existing `/admin` pages (see *Gaps* below) |
| `pocketbase` npm SDK | `src/lib/api/client.ts`, same call shape |

### Why the frontend barely changed

`src/lib/pb.ts` still exports `pb()`, `pbCall()`, `fileUrl()` and `PbError`, now
backed by the new API. `pb().collection("orders").getFullList({ filter, sort })`
works exactly as before, so the 79 call sites across 36 files kept working —
the transport changed, not the code that uses it.

Two things had to change:

- **`logout()` is now async.** It clears a server-side cookie.
- **Auth is not readable synchronously.** An httpOnly cookie cannot be read by
  JavaScript, so `authStore.ready` is false until `/api/auth/session` answers.
  The account and admin shells wait for it rather than redirecting immediately.

---

## Setting it up

### 1. Fill in the connection string

`frontend/.env.local` was created with the Atlas URI and a generated
`AUTH_SECRET`. Replace the password placeholder:

```
MONGODB_URI=mongodb+srv://admin-user:<db_password>@cluster0.rpildmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

`MONGODB_URI` and `AUTH_SECRET` are secrets: no `NEXT_PUBLIC_` prefix, never
committed.

### 2. Allow Atlas to accept connections

Atlas blocks unknown IPs by default. In **Network Access**, allow your own IP for
local development. For Vercel, whose egress addresses are not fixed, allow
`0.0.0.0/0` — the database is still protected by the username and password — or
use a dedicated egress IP if you need tighter control.

### 3. Create indexes and seed

```bash
cd frontend
npm run db:setup     # indexes only
npm run db:seed      # + demo catalogue, shipping rates, logistics settings
npm run db:admin     # + create an administrator (prompts for email/password)
npm run db:init      # seed and admin together
```

### 4. Bring existing data across (optional)

Only if the old PocketBase instance still runs:

```bash
cd frontend
PB_URL=http://localhost:8090 \
PB_SUPERUSER=you@example.com PB_SUPERUSER_PASSWORD=... \
npm run db:migrate-from-pb -- --dry-run    # preview
npm run db:migrate-from-pb                  # for real
```

Relations are remapped from PocketBase's 15-character ids to MongoDB ObjectIds,
and each document keeps its original id in `pb_id` so the script is re-runnable.

**Passwords cannot come across** — PocketBase's hashes are not portable. Migrated
customers must use *Forgot password*, and you create the admin with
`npm run db:admin`.

### 5. Point Veloxa at the store

Veloxa reads the same three public endpoints, which now live on the store:

```
NEXT_PUBLIC_API_URL=https://xperiencedelivery.shop
```

`NEXT_PUBLIC_PB_URL` is still honoured as a fallback so the current deployment
keeps working until you change it.

---

## Security notes

Worth stating plainly, because this is where the migration carried real risk.

- **Read rules are query filters, never post-fetch checks.** Every policy returns
  a Mongo filter that is ANDed into the query, so a row the caller may not see is
  never loaded. A forgotten check cannot leak a row; it fails closed.
- **Filter strings are parsed against an allowlist.** `?filter=` accepts only the
  handful of `field op value` forms the app already used. Anything else — `$where`,
  operator objects, `||` — is rejected with a 400.
- **Sessions are httpOnly.** The old JWT sat in localStorage where any script
  could read it. The cookie cannot be read by JavaScript at all.
- **Writes are field-allowlisted.** `policy.writable` means a customer can attach
  proof to a payment but never set `status: "paid"`, and can book a shipment but
  never set its price.
- **Uploads are private.** `/api/files/{id}/{name}` serves a file only to its
  owner or an admin, and answers 404 (not 403) otherwise so ids cannot be probed.
- **Webhook signatures are verified against the raw body**, before parsing.

---

## Gaps

Things this migration does not carry over, so nothing is silently assumed done:

1. **No email is sent.** PocketBase sent verification and password-reset mail.
   `/api/auth/forgot-password` issues a valid one-hour token and logs the reset
   link to the server console in development, but no mail provider is wired up.
   Pick one (Resend, SES, Postmark) and send from that route.
2. **No admin database UI.** PocketBase's `/_/` is gone. The `/admin` pages cover
   products, categories, orders, customers, reviews, coupons, shipping and
   Veloxa. For anything outside those, use MongoDB Compass or the Atlas UI.
3. **No realtime.** Nothing in the app subscribed to it, but the capability is
   gone; MongoDB change streams would be the equivalent.
4. **`pocketbase/` is untouched.** The binary, migrations and hooks are still in
   the repo. Once you have verified the new backend, that directory and the
   `pocketbase` npm dependency can be deleted.
