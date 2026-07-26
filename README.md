# Partner Onboard

Standalone admin tool for onboarding Partners and their Representatives — searchable
directories of both, CSV exports, and multi-user accounts with roles.

## Stack

- **Server**: Node.js + Express, deployed as a single Vercel serverless function
  (`api/index.js`).
- **Database**: [libSQL](https://turso.tech) via `@libsql/client`. Locally it defaults to
  a SQLite file at `server/data/partners.db` — no setup needed. In production it talks to
  a hosted Turso database over the network, since Vercel functions have no persistent
  local disk.
- **Client**: React + Vite, built to static files and served from the same Vercel project.
- **Auth**: multi-user accounts stored in the `users` table (email + bcrypt-hashed
  password + role), a signed JWT in an httpOnly cookie for the session. No third-party
  auth provider. `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` env vars only matter once, to seed
  the very first admin account when the `users` table is empty — after that, manage
  accounts from the Users and Roles page.

## Local setup

```
npm install
npm run dev
```

This starts the API on `http://localhost:3001` and the web app on `http://localhost:5173`
(the Vite dev server proxies `/api` to the backend). Open `http://localhost:5173` — you'll
land on `/login`.

You need `server/.env` with at least these before you can log in locally the first time
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
   - Do **not** set `NODE_ENV` yourself — Vercel sets it to `production` automatically at
     runtime, and setting it as a project env var makes `npm install` skip
     `devDependencies` during the build, which breaks the client build (`vite: command
     not found`). This bit us once already.

4. Deploy. The app and API share one domain, so there's no CORS to configure.

5. If you deploy again later via `vercel --prod` from the CLI instead of a git push, note
   that it does **not** automatically repoint a custom alias (e.g.
   `your-project.vercel.app`) that was set some other way — you may need
   `vercel alias set <new-deployment-url> <your-domain>` after a CLI deploy.

## What's included

- **Login / logout** (`/login`) — the only public page. Every other page and API requires
  a valid session; unauthenticated visits redirect to `/login`.
- **Two roles**: **Admin** (full access) and **Viewer** (read-only — can view and export
  everything, cannot create/edit Partners or manage Users).
- **Dashboard** (`/dashboard`) — partner/representative counts and a Partners by Type
  breakdown.
- **Partners list** (`/partners`) — search by Partner ID, Partner Name, Contact Name, or
  Contact Email; filter by Partner Type or Status; CSV export; Edit action per row (admin
  only).
- **Add Partner** (`/partners/new`, admin only) — Partner details (including Status:
  Active/Pending/Inactive), Contact information, Billing address, one or more
  Representatives (exactly one must be Primary), and a live validation panel backed by
  real server checks (ID availability, email/phone/ZIP format, exact-duplicate detection).
- **Edit Partner** (`/partners/:partnerId/edit`, admin only) — same fields as Add.
  Removing an existing Representative requires an explicit confirmation dialog; it's
  never silent.
- **Partner detail** (`/partners/:partnerId`) — full record and Representatives (Primary
  flagged), each showing who created/last updated it.
- **Representatives** (`/representatives`) — every representative across every partner,
  searchable, linking back to its partner.
- **Reports** (`/reports`) — Partners by Type breakdown plus one-click CSV export.
- **Users and Roles** (`/users`, admin only) — create accounts (email + password you set
  directly, no email-sending infrastructure), change role, reset password, delete a user.
  Blocks deleting your own account and demoting/deleting the last remaining admin, so you
  can't lock yourself out.
- **Audit Log** (`/audit-log`, admin only) — logs, filterable/searchable/exportable:
  login/login-failed/logout and Partner/User created/updated/deleted, each with the
  acting user's email and timestamp.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_EMAIL` | Only to seed the first account | Bootstraps one admin user when the `users` table is empty |
| `ADMIN_PASSWORD_HASH` | Only to seed the first account | bcrypt hash — never the plaintext |
| `SESSION_SECRET` | Yes | Signs the session JWT |
| `TURSO_DATABASE_URL` | Production only | Hosted DB URL; unset locally to use the SQLite file |
| `TURSO_AUTH_TOKEN` | Production only | Hosted DB auth token |

Never commit `server/.env` — it's gitignored. `server/.env.example` documents the shape
with no real values. Do not set `NODE_ENV` as a project env var (see deploy step 3).

## Notes / limitations

- Partner deletion is intentionally not implemented (per spec, until a safe archive
  process is designed).
- Partner Type / Status / State / Country Code option lists live in
  `server/src/constants.js` — edit there to add more.
- Sessions are stateless JWTs (12h expiry) re-validated against the `users` table on every
  request — a role change or account deletion takes effect immediately, but "logout" only
  clears the browser's cookie, it doesn't invalidate the token itself before it expires.
