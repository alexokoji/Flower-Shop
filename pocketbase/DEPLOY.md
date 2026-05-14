# Deploy PocketBase — for free, forever

PocketBase needs **persistent disk** for its SQLite file and uploaded images.
That rules out every serverless free tier (Vercel, Netlify, Cloudflare
Pages/Workers, Render's free web service). The genuinely-free options that
remain are real VMs you SSH into yourself.

> Looking for the managed Docker path on Fly? See **[DEPLOY-FLY.md](DEPLOY-FLY.md)**
> (~$2.50/mo, sits under Fly's Hobby credit).

## Honest summary of the options

| Option | Cost | Setup time | Notes |
| --- | --- | --- | --- |
| **Google Cloud — e2-micro Always Free** | $0/mo forever | ~20 min | 1 vCPU, 1 GB RAM, 30 GB disk. Free only in `us-west1`, `us-central1`, `us-east1`. |
| **Oracle Cloud — Always Free ARM** | $0/mo forever | ~30 min (account approval can be slow) | 4 ARM cores, 24 GB RAM, 200 GB disk. Overkill for this, but unbeatable. |
| **Cloudflare Tunnel + your own machine** | $0/mo | ~10 min | If you have an always-on Pi / mini-PC / old laptop at home. |
| **Hetzner CX22** | ~$4/mo | ~15 min | Best paid value if you want zero free-tier admin hassle. |
| **Fly.io Hobby plan** | ~$2.50/mo (covered by $5 credit) | ~10 min | See [DEPLOY-FLY.md](DEPLOY-FLY.md) for Dockerfile + `fly.toml`. |
| **PocketHost.io** | ~~$0~~ ~$5/mo+ | ~5 min | Was free, now paid. Skip. |

This guide walks through **Google Cloud's free e2-micro** — the most accessible
truly-free path. Other paths share the same shape: get a Linux VM, copy
the binary + `pb_migrations/` + `pb_hooks/`, put TLS in front, done.

---

## Path A — Google Cloud Free Tier (recommended)

### 1. Create the VM

1. Sign up at <https://console.cloud.google.com> (requires a credit card for verification — won't be charged on free tier)
2. Open **Compute Engine → VM instances → Create instance**
3. Configuration:
   - **Name:** `pocketbase`
   - **Region:** one of `us-west1`, `us-central1`, or `us-east1` (mandatory for Always Free)
   - **Zone:** any
   - **Machine type:** `e2-micro` (this is the always-free SKU)
   - **Boot disk:** Debian 12, **30 GB Standard persistent disk** (max free)
   - **Firewall:** check **Allow HTTPS** and **Allow HTTP**
4. Click **Create**. Note the **external IP** once it boots.

### 2. SSH in and install PocketBase

Click the **SSH** button next to the VM in the console (opens a browser
shell, no key setup needed):

```bash
# Update + tools
sudo apt update && sudo apt install -y unzip ufw

# Get the PocketBase binary (Linux amd64)
PB_VERSION=0.38.0
wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip
unzip pocketbase_${PB_VERSION}_linux_amd64.zip -d ~/pb
chmod +x ~/pb/pocketbase

# Folders for our schema + hooks
mkdir -p ~/pb/pb_migrations ~/pb/pb_hooks ~/pb/pb_data
```

### 3. Upload migrations + hooks

From your **local machine**, in the project root:

```bash
# Replace <vm-ip> with your VM's external IP
# Replace <gcp-user> with your Google account's username (shown in the SSH window)
scp pocketbase/pb_migrations/*.js <gcp-user>@<vm-ip>:~/pb/pb_migrations/
scp pocketbase/pb_hooks/main.pb.js <gcp-user>@<vm-ip>:~/pb/pb_hooks/
```

(If `scp` fails, use the **Upload file** menu in the browser SSH window.)

### 4. Run PocketBase as a systemd service

Back in the VM's SSH:

```bash
sudo tee /etc/systemd/system/pocketbase.service > /dev/null <<'EOF'
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=YOUR_USER     # change to your username (whoami)
ExecStart=/home/YOUR_USER/pb/pocketbase serve --http=0.0.0.0:8090 \
  --dir=/home/YOUR_USER/pb/pb_data \
  --migrationsDir=/home/YOUR_USER/pb/pb_migrations \
  --hooksDir=/home/YOUR_USER/pb/pb_hooks
Restart=on-failure

# Secrets for payment webhooks (edit these)
Environment=FRONTEND_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
Environment=PAYSTACK_SECRET_KEY=sk_test_xxx
Environment=FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
Environment=FLUTTERWAVE_WEBHOOK_HASH=xxx
Environment=MONNIFY_SECRET_KEY=xxx
Environment=MONNIFY_WEBHOOK_SECRET=xxx

[Install]
WantedBy=multi-user.target
EOF

# Replace YOUR_USER placeholders with your actual username:
sudo sed -i "s/YOUR_USER/$(whoami)/g" /etc/systemd/system/pocketbase.service

sudo systemctl daemon-reload
sudo systemctl enable --now pocketbase
sudo systemctl status pocketbase   # confirm it's running
```

### 5. Put HTTPS in front with Caddy

PocketBase listens on plain HTTP; you need HTTPS for browsers and webhook providers.
Caddy gives you free auto-renewing Let's Encrypt certs with one config file.

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

# Optional: point a domain (e.g. pb.yourname.com) at the VM IP first,
# then use it below. If you don't have a domain, you can use sslip.io:
# <vm-ip>.sslip.io  — gives you an auto-resolving subdomain for free.

sudo tee /etc/caddy/Caddyfile > /dev/null <<'EOF'
pb.example.com {                 # ← change to your domain or <ip>.sslip.io
    reverse_proxy 127.0.0.1:8090
}
EOF

sudo systemctl reload caddy
```

Visit `https://pb.example.com/_/` — first time, set up the admin superuser.

### 6. Connect the frontend

In Vercel project settings:

```
NEXT_PUBLIC_PB_URL = https://pb.example.com
```

Redeploy. Site is live.

### 7. Configure payment webhooks

In each provider's dashboard:

```
https://pb.example.com/api/webhooks/paystack
https://pb.example.com/api/webhooks/flutterwave
https://pb.example.com/api/webhooks/monnify
```

---

## Path B — Cloudflare Tunnel + your own machine

If you have any always-on machine (Raspberry Pi, mini-PC, even a desktop)
and don't want a cloud VM at all, this is the lightest path:

1. Install Cloudflare's `cloudflared` on the machine
2. Run `cloudflared tunnel --hostname pb.example.com --url http://localhost:8090`
3. Run PocketBase locally as above
4. Cloudflare handles HTTPS + DDoS + the public hostname for free; your
   home IP is never exposed

Docs: <https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/>

---

## Day-2 operations

- **Backups:** weekly `tar -czf pb_backup_$(date +%F).tar.gz ~/pb/pb_data` and download. Or use `gsutil cp` to a free GCS bucket (Always Free includes 5 GB).
- **Update PocketBase:** stop the service, `wget` a newer binary, restart. Migrations run automatically on boot.
- **Deploy hook / migration changes:** `scp` the changed files, `sudo systemctl restart pocketbase`.
- **Logs:** `journalctl -u pocketbase -f`
- **Resource use:** PocketBase typically idles at ~30 MB RAM; the e2-micro's 1 GB easily fits everything we need.

---

## Common pitfalls

| Symptom | Fix |
| --- | --- |
| `Permission denied` on `scp` | Generate an SSH key locally and add the public key in the VM's metadata, or use the browser SSH upload button |
| `:8090 connection refused` | `sudo systemctl status pocketbase` — usually a path typo in the service file |
| Caddy can't get cert | Your domain's DNS A-record must point at the VM IP for Let's Encrypt to validate |
| Browser CORS error | PocketBase allows all origins by default; double-check `NEXT_PUBLIC_PB_URL` matches exactly |
| Slow upload of product images | The 1 vCPU / 1 GB e2-micro is fine for browsing, slower under heavy concurrent uploads — bump to a paid VM ($4/mo Hetzner) if it bites |