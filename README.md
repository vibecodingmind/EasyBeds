# Vanguard PMS OS

Multi-tenant hotel property management system (PMS), channel manager, and modular hotel operating system.

## Production status

This build is deployable as a staging / private production service:

- Durable SQLite storage (JSON snapshot backup) survives process restarts
- JWT + httpOnly session cookies; tenant identity is taken from the signed token, not spoofable headers
- Login, logout, health/readiness probes, Docker image, and graceful shutdown
- iCal (RFC 5545) feeds remain live; OTA XML/JSON adapters, Stripe, Twilio, and lock encoders stay in sandbox mode until live credentials are supplied

## Quick start (development)

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000 and sign in.

Demo accounts (password comes from `DEMO_PASSWORD` in `.env`):

| Email | Role |
| --- | --- |
| alexander@vanguard-pms.io | SaaS Super Admin |
| maya.lin@vanguard-pms.io | Platform support |
| elena@azurehospitality.com | Hotel owner |
| sarah.j@azurehospitality.com | Front desk |

## Deploy with Docker

```bash
export JWT_SECRET="$(openssl rand -hex 32)"
export DEMO_PASSWORD="$(openssl rand -base64 18)"
docker compose up --build -d
```

Data is stored in the `vanguard-data` volume. Health checks:

- `GET /health` — liveness
- `GET /ready` — persistence is writable
- `GET /api/health` — authenticated-stack health (also public)

## Deploy on Railway

1. In Railway, **New Project → Deploy from GitHub repo** and select this repository (branch `cursor/deploy-readiness-8673` until merged).
2. Railway uses Nixpacks + Node 22 (`railway.json`, `nixpacks.toml`, `.nvmrc`). It runs `npm ci`, `npm run build`, then `npm start`.
3. Set these **Variables** (service → Variables):

   | Variable | Value |
   | --- | --- |
   | `JWT_SECRET` | `openssl rand -hex 32` (required, 32+ chars or the process exits) |
   | `DEMO_PASSWORD` | your sign-in password for seed accounts |
   | `DEMO_LOGIN_HINTS` | `true` for a private demo, `false` on a public URL |
   | `APP_URL` | `https://<your-service>.up.railway.app` (or your custom domain) |

   Railway injects `PORT` automatically. This app already binds to `process.env.PORT`.

4. Attach a **volume** so hotel data survives deploys:
   - Mount path: `/app/data`
   - The server uses `RAILWAY_VOLUME_MOUNT_PATH` (or `DATA_DIR`) for SQLite + JSON snapshots.

5. Generate a public domain (Settings → Networking → Generate Domain). Health check is `GET /health`.

6. Deploy. Sign in with a seed account (see the table above) using `DEMO_PASSWORD`.

`railway.json` and `nixpacks.toml` are already in the repo (`npm start` after `npm run build`, restart on failure).

## Deploy without Docker

```bash
npm ci
npm run build
NODE_ENV=production JWT_SECRET="..." DEMO_PASSWORD="..." PORT=3000 DATA_DIR=./data npm start
```

## Environment

See `.env.example`. In production the process will refuse to start unless **`JWT_SECRET` is at least 32 characters** and **`DEMO_PASSWORD` is set**.

## Security notes

- Do not expose the demo password on a public internet deployment without changing `DEMO_PASSWORD` and rotating hashes (delete `data/` to re-seed, or update hashes via staff admin).
- Set `DEMO_LOGIN_HINTS=false` in public production.
- Set `ICAL_FEED_SECRET` to require a token on public `.ics` URLs.
- Live Stripe / Twilio / SendGrid / certified OTA gateways are opt-in via environment credentials.
