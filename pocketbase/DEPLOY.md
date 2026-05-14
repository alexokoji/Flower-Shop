# Deploy PocketBase to PocketHost.io

PocketHost is a managed PocketBase host — no Docker, no `flyctl`, no server.
You upload your migrations + hooks, they keep the binary running on a
persistent disk. Free tier covers a small instance with a custom subdomain.

> Looking for the self-hosted Fly.io path instead? See [DEPLOY-FLY.md](DEPLOY-FLY.md).

---

## 1. Sign up & create an instance

1. Go to <https://pockethost.io>, sign up
2. Click **New Instance**
3. Pick a subdomain — becomes `https://<yoursub>.pockethost.io`
4. Wait ~30s for it to provision

## 2. Create the superuser (admin UI login)

Visit `https://<yoursub>.pockethost.io/_/` and follow the prompt to set an
email + password. This is the **admin UI** login, separate from the app's
own `admin@xperiencedelivery.test` demo user.

## 3. Upload migrations + hooks

PocketHost gives you a file browser for each instance. You'll upload:

- Everything in `pocketbase/pb_migrations/` → into the instance's `pb_migrations/` folder
- The single file `pocketbase/pb_hooks/main.pb.js` → into the instance's `pb_hooks/` folder

**Two ways to do it:**

### Option A — Dashboard upload (easiest)

1. In your PocketHost instance dashboard, open the **File Browser**
2. Navigate to `pb_migrations/` (create the folder if absent)
3. Drag every `.js` file from your local `pocketbase/pb_migrations/` in
4. Repeat for `pb_hooks/main.pb.js`

### Option B — PocketHost CLI

```bash
npm install -g @pockethost/cli
pockethost login
pockethost deploy <instance-name>
# pushes ./pb_migrations and ./pb_hooks
```

(Run from the `pocketbase/` directory.)

## 4. Restart the instance

PocketHost detects the new migrations on boot. From the dashboard:
**Settings → Restart instance**. Watch the logs — you should see:

```
Applied 1747000000_init_users.js
Applied 1747000010_categories.js
...
Applied 1747000600_rename_demo_emails.js
```

All 16-ish migrations apply automatically. The carts collection, users,
products, etc. are now live.

## 5. Set the environment variables

PocketHost has a **Secrets** panel for each instance. Add:

| Variable | What it is |
| --- | --- |
| `FRONTEND_URL` | Your Vercel URL — e.g. `https://xperiencedelivery.vercel.app` |
| `PAYSTACK_SECRET_KEY` | From Paystack dashboard → Settings → API Keys |
| `PAYSTACK_WEBHOOK_SECRET` | Optional — Paystack auto-signs with secret key |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave dashboard → Settings → API |
| `FLUTTERWAVE_WEBHOOK_HASH` | Flutterwave dashboard → Settings → Webhooks |
| `MONNIFY_SECRET_KEY` | Monnify dashboard → API & Webhooks |
| `MONNIFY_WEBHOOK_SECRET` | Same panel |

After saving, **restart the instance again** so the JS hooks pick up the new env vars.

## 6. Point the frontend at it

In your Vercel project's environment variables:

```
NEXT_PUBLIC_PB_URL = https://<yoursub>.pockethost.io
```

Redeploy Vercel (or push a commit). Frontend now talks to your hosted PocketBase.

## 7. Configure payment webhooks

For each provider, set the webhook URL to:

```
https://<yoursub>.pockethost.io/api/webhooks/paystack
https://<yoursub>.pockethost.io/api/webhooks/flutterwave
https://<yoursub>.pockethost.io/api/webhooks/monnify
```

These hit the custom routes defined in `pb_hooks/main.pb.js`. They verify
the request signature against the matching secret you set in step 5.

## 8. Verify

```bash
curl https://<yoursub>.pockethost.io/api/health
# {"message":"API is healthy.","code":200,"data":{}}

curl "https://<yoursub>.pockethost.io/api/collections/products/records?perPage=1"
# Should return one product
```

Hit the admin UI at `/_/` to confirm all collections exist and have records.

---

## Pushing changes later

When you edit `pb_migrations/` or `pb_hooks/` locally, re-upload the
changed files via dashboard or:

```bash
pockethost deploy <instance-name>
```

…then restart the instance. New migration files auto-apply; hook changes
take effect on restart.

## Things to know about the free tier

- **Persistence:** your DB + uploaded files are stored on PocketHost's disk
  and survive restarts
- **Subdomain:** `*.pockethost.io` is free; custom domains are a paid add-on
- **Instance pause:** free-tier instances may suspend after a long idle
  period — they resume on first request (small cold-start latency). Not a
  problem for browsing, but webhooks fired during a cold start may take a
  few seconds. Both Paystack and Flutterwave retry on timeout, so payment
  flows survive this.
- **Backups:** export collections regularly via the admin UI (`/_/` →
  Settings → Export collections) or use `pockethost backup` from the CLI.

## Common pitfalls

| Symptom | Fix |
| --- | --- |
| Migrations not running | Check you uploaded to `pb_migrations/` (exact folder name) and restarted |
| Webhook 401 (invalid signature) | The secret in step 5 must match exactly what the provider signs with |
| Frontend `Failed to fetch` | `NEXT_PUBLIC_PB_URL` must be the full `https://` URL with no trailing slash |
| Admin UI 404 at `/_/` | Allow ~30s after first start; PocketHost provisions then warms the binary |
| Hooks not loading | PocketHost must recognise `pb_hooks/main.pb.js` — file must be named exactly `*.pb.js` |

---

## Cost reality check

PocketHost's **free tier** as of writing actually covers a single small
instance with sufficient storage for early-stage usage. You'll only need
to pay if you grow past their storage / instance limits or want a custom
domain. For a demo or early-stage shop, $0/month is realistic.

If they ever change the free tier, the Fly.io path (`DEPLOY-FLY.md`)
remains a tested fallback at ~$2.50/month under Fly's Hobby credit.