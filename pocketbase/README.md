# PocketBase backend

A single Go binary that gives you Postgres-like collections (SQLite under the hood), email/password auth, file storage, and a real-time API — all called directly from the browser.

## 1. Install the binary

Download the latest release for your OS from [pocketbase.io/docs/](https://pocketbase.io/docs/) and drop the `pocketbase.exe` (Windows) or `pocketbase` (macOS/Linux) **into this folder** (next to `pb_migrations/`).

> Suggested version: `>= 0.22`.

The binary stays out of git (see `.gitignore`).

## 2. Run

```bash
# Windows (PowerShell)
.\pocketbase.exe serve

# macOS / Linux
./pocketbase serve
```

On first run PocketBase will:

1. Create `pb_data/` (the SQLite DB + uploaded files — git-ignored)
2. Auto-apply every JS migration in `pb_migrations/` (collections + seed data)
3. Auto-load every script in `pb_hooks/` (webhook handlers, custom routes)
4. Prompt you to create a superuser (admin) — use any email/password you like; this is for the admin UI only

PocketBase will then be listening at:

| URL | Purpose |
| --- | --- |
| `http://localhost:8090/_/` | Admin UI |
| `http://localhost:8090/api/` | REST + realtime API (called from the Next.js frontend) |
| `http://localhost:8090/api/webhooks/{provider}` | Payment webhook endpoints |

## 3. Seeded data

The first migration runs after collection creation and seeds:

- 12 demo products (6 flowers + 6 necklaces) across all categories
- All categories (Wedding, Birthday, Valentine, Anniversary, Funeral, Graduation, Pendants, Chains, Layered, Chokers, Stone & Gem)
- Shipping rates for 13 countries × 2 methods
- 1 demo customer: `customer@xperiencedelivery.test` / `Customer@1234`
- 1 demo admin (role=admin): `admin@xperiencedelivery.test` / `Admin@1234`

Countries (28) and currencies (10) live as **static JSON** in `frontend/src/data/` — no DB table needed.

## 4. Deploy

PocketBase ships as a single binary. To deploy:

1. Build or download the Linux binary for your host
2. Copy `pb_migrations/`, `pb_hooks/`, and the binary to the server
3. Run `./pocketbase serve --http=0.0.0.0:8090` behind nginx/caddy with TLS
4. Mount `pb_data/` on persistent storage (DigitalOcean Volume, Fly.io Volume, etc.)
5. Set environment variables for payment secrets (see `pb_hooks/main.pb.js`)

Free hosts that work well: Fly.io ($0–5/mo), Railway, Hetzner Cloud, a $5 VPS — anywhere you can put a binary.

## 5. Reset everything

```bash
# Stop pocketbase, then:
Remove-Item -Recurse -Force pb_data   # PowerShell
# or
rm -rf pb_data                        # bash
# Restart — migrations re-run from scratch.
```
