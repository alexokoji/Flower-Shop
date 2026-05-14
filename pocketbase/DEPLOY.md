# Deploy PocketBase to Fly.io

Targets `pocketbase/` as the build context. Frontend deploys separately to
Vercel and points `NEXT_PUBLIC_PB_URL` at the Fly app's URL.

## Prerequisites

1. Free Fly account: <https://fly.io/app/sign-up>
2. `flyctl` CLI: <https://fly.io/docs/hands-on/install-flyctl/>
   ```powershell
   # Windows (PowerShell):
   pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```
3. Sign in:
   ```bash
   fly auth login
   ```

## First deploy

From the **`pocketbase/`** folder:

```bash
cd pocketbase

# 1. Pick a globally-unique app name and update fly.toml's `app = "..."`.
#    The URL becomes  https://<name>.fly.dev  — try one and re-pick if taken.

# 2. Create the app (no machines yet)
fly apps create xperience-delivery-pb       # use the same name as fly.toml

# 3. Create the persistent volume in the same region as your app.
fly volumes create pb_data --region iad --size 1
# `--size 1` = 1 GB. Free tier accommodates this. Expand later with
# `fly volumes extend <id> --size 3`.

# 4. Push secrets (payment provider keys + frontend origin)
fly secrets set \
  FRONTEND_URL="https://YOUR-VERCEL-DOMAIN.vercel.app" \
  PAYSTACK_SECRET_KEY="sk_test_xxx" \
  PAYSTACK_WEBHOOK_SECRET="xxx" \
  FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-xxx" \
  FLUTTERWAVE_WEBHOOK_HASH="xxx" \
  MONNIFY_SECRET_KEY="xxx" \
  MONNIFY_WEBHOOK_SECRET="xxx"

# 5. Deploy
fly deploy
```

On first deploy:
- Fly builds the Docker image (~2 min)
- PocketBase boots, mounts the volume, runs all migrations
- A bootstrap URL prints in `fly logs` — open it to create the superuser

```bash
fly logs              # watch the boot
fly status            # see the URL
fly open              # open the dashboard in browser
```

Your PocketBase is now at `https://<your-app>.fly.dev`. Set this as
`NEXT_PUBLIC_PB_URL` on Vercel.

## Subsequent deploys

```bash
fly deploy           # pushes any changes to pb_hooks/, pb_migrations/, Dockerfile
```

Migrations auto-apply on the next container boot.

## Connecting the frontend (Vercel)

In your Vercel project's environment variables:

```
NEXT_PUBLIC_PB_URL = https://<your-app>.fly.dev
```

Trigger a rebuild on Vercel. The Next.js storefront will now talk to the
hosted PocketBase.

## Configure payment webhooks

For each provider, in their dashboard set the webhook URL to:

```
https://<your-app>.fly.dev/api/webhooks/paystack
https://<your-app>.fly.dev/api/webhooks/flutterwave
https://<your-app>.fly.dev/api/webhooks/monnify
```

Use the secrets you set via `fly secrets set`.

## Backups (recommended)

The volume is your DB + uploaded files. Snapshot it weekly:

```bash
fly volumes snapshots create pb_data
fly volumes snapshots list pb_data   # browse + restore later
```

Fly keeps the last 5 snapshots free per volume.

## Common pitfalls

| Symptom | Fix |
| --- | --- |
| `apps create` fails: name taken | Pick a different unique name; update `fly.toml` |
| Build fails downloading binary | Bump `PB_VERSION` in the Dockerfile to whatever's latest at <https://github.com/pocketbase/pocketbase/releases> |
| `/api/health` returns 502 | Wait 30s after first boot; check `fly logs` for migration errors |
| Volume not mounting | Run `fly volumes list`; ensure the region matches `primary_region` in `fly.toml` |
| Frontend `Failed to fetch` | CORS — PB allows all origins by default, but if you set `FRONTEND_URL` and changed your domain, update it |

## Cost reality check

Fly removed the "free tier" in 2024 — what you get now is a **$5 monthly
credit** on the Hobby plan. A 256 MB / shared-cpu-1x VM with a 1 GB volume
typically costs ~$2.50 / month, so it stays under the credit. If you scale up
(bigger memory, more storage), you'll start paying the overage.

For genuinely $0, see PocketHost.io — managed PocketBase with a free tier.