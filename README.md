# Partner Onboard

Standalone admin tool for onboarding Partners and their Representatives, generating a
permanent unique lead-collection form link per Partner, and reviewing/exporting leads
that come back in. Requires admin login; the per-partner lead form itself stays public.

## Stack

- **Server**: Node.js + Express, deployed as a single Vercel serverless function
  (`api/index.js`).
- **Database**: [libSQL](https://turso.tech) via `@libsql/client`. Locally it defaults to
  a SQLite file at `server/data/partners.db` — no setup needed. In production it talks to
  a hosted Turso database over the network, since Vercel functions have no persistent
  local disk.
- **Client**: React + Vite, built to static files and served from the same Vercel project.
- **Auth**: a single admin account (email + bcrypt-hashed password, both env vars), a
  signed JWT in an httpOnly cookie for the session. No third-party auth provider.

## Local setup

```
npm install
npm run dev
```

This starts the API on `http://localhost:3001` and the web app on `http://localhost:5173`
(the Vite dev server proxies `/api` to the backend). Open `http://localhost:5173` — you'll
land on `/login`.

You need `server/.env` with at least the admin credentials before you can log in locally
(see `server/.env.example`):

```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD_HASH=$2b$10$...   # bcrypt hash, generate with the command below
SESSION_SECRET=...               # random string, generate with the command below
```

Generate those two values with:

```
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` can stay unset for local dev — the SQLite file
is created automatically at `server/data/partners.db`.

## Deploying to Vercel

1. **Create a Turso database** (free tier is plenty). Easiest via the web dashboard at
   turso.tech: sign up, create a database, and it'll show you a connection URL
   (`libsql://...`) and let you generate an auth token.

2. **Push this project to a GitHub repo** and import it in Vercel ("Add New… → Project"),
   with **Root Directory set to the repo root** (not `server/` or `client/`) so Vercel
   picks up `vercel.json`, which builds the client and wires `/api/*` to the Express app
   in `api/index.js`.

3. **Set environment variables** on the Vercel project (Settings → Environment Variables):
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` — from step 1
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` — same values as your local
     `server/.env`, or generate fresh ones for production
   - `NODE_ENV=production` — makes the session cookie `Secure` (Vercel sets this
     automatically in most cases, but confirm it's present)

4. Deploy. The app and API share one domain, so there's no CORS to configure, and partner
   form links (`/form/:token`) are built from the browser's actual origin at runtime — they
   will point at your Vercel domain automatically, never `localhost`.

## What's included

- **Login / logout** (`/login`) — the only public admin-adjacent page. All `/partners/*`
  and `/leads` pages and their APIs require a valid session; unauthenticated visits
  redirect to `/login`.
- **Partners list** (`/partners`) — search by Partner ID, Partner Name, Contact Name, or
  Contact Email; filter by Partner Type; CSV export; Edit action per row.
- **Add Partner** (`/partners/new`) — Partner details, Contact information, Billing
  address, one or more Representatives (exactly one must be Primary), and a live
  validation panel backed by real server checks (ID availability, email/phone/ZIP format,
  exact-duplicate detection).
- **Edit Partner** (`/partners/:partnerId/edit`) — same fields as Add. The public form
  link and all submitted leads are preserved across edits. Removing an existing
  Representative requires an explicit confirmation dialog; it's never silent.
- **Partner detail** (`/partners/:partnerId`) — full record, Representatives (Primary
  flagged), the permanent public form link (copy/open), and every lead submitted through
  it, with a CSV export scoped to that partner.
- **Public lead form** (`/form/:token`) — no login required. Partner ID and Partner Name
  are pre-filled and read only; the submit button disables while processing to avoid
  duplicate submissions from repeated clicks.
- **Leads** (`/leads`) — every lead across every partner, searchable by lead name, email,
  Partner ID, or Partner Name, filterable by submission date range, with CSV export.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD_HASH` | Yes | bcrypt hash of the admin password — never the plaintext |
| `SESSION_SECRET` | Yes | Signs the session JWT |
| `TURSO_DATABASE_URL` | Production only | Hosted DB URL; unset locally to use the SQLite file |
| `TURSO_AUTH_TOKEN` | Production only | Hosted DB auth token |
| `NODE_ENV` | Production | Set to `production` so the session cookie is marked `Secure` |

Never commit `server/.env` — it's gitignored. `server/.env.example` documents the shape
with no real values.

## Notes / limitations

- Single admin account by design (this release didn't call for multi-user roles).
- Partner deletion is intentionally not implemented (per spec, until a safe archive
  process is designed).
- Partner Type / State / Country Code option lists live in `server/src/constants.js` —
  edit there to add more.
- Duplicate-lead-submission prevention is client-side (disabled submit button while
  processing); there's no server-side idempotency window for retried network requests.
