import { createClient } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localDbPath = path.join(__dirname, "..", "data", "partners.db");

const url = process.env.TURSO_DATABASE_URL || `file:${localDbPath}`;

if (url.startsWith("file:")) {
  fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
}

export const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN
});

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT UNIQUE NOT NULL,
    partner_name TEXT NOT NULL,
    partner_type TEXT NOT NULL,
    contact_first_name TEXT NOT NULL,
    contact_last_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    phone_number TEXT,
    street1 TEXT NOT NULL,
    street2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'US',
    form_token TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS representatives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_pk INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    representative_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// --- Safe, additive migrations: only add columns that are missing so
// existing data (local or in Turso) is never touched or lost. ---
async function ensureColumn(table, column, ddlType, backfillFromColumn) {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  const cols = rowsToObjects(info).map((r) => r.name);
  if (cols.includes(column)) return;

  await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddlType}`);
  if (backfillFromColumn) {
    await client.execute(`UPDATE ${table} SET ${column} = ${backfillFromColumn} WHERE ${column} IS NULL`);
  }
}

export function rowsToObjects(result) {
  const cols = result.columns;
  return result.rows.map((row) => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

export function rowToObject(result) {
  return rowsToObjects(result)[0] || null;
}

await ensureColumn("partners", "updated_at", "TEXT", "created_at");
await ensureColumn("representatives", "updated_at", "TEXT", "created_at");
await ensureColumn("partners", "created_by", "TEXT");
await ensureColumn("partners", "updated_by", "TEXT");
await ensureColumn("representatives", "created_by", "TEXT");
await ensureColumn("representatives", "updated_by", "TEXT");
await ensureColumn("partners", "status", "TEXT NOT NULL DEFAULT 'Active'");

// The Leads feature (and its public submission form) was dropped from
// scope. Removes the table and any previously submitted lead data.
await client.execute("DROP TABLE IF EXISTS leads");

// Bootstrap the first admin account from env vars so existing deployments
// (and local dev) keep working once auth moves from env-only to a real
// users table. Only runs when the users table is empty — never touches an
// existing account.
const userCount = rowToObject(await client.execute("SELECT COUNT(*) c FROM users")).c;
if (userCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
  await client.execute({
    sql: `INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin')`,
    args: [process.env.ADMIN_EMAIL.trim().toLowerCase(), process.env.ADMIN_PASSWORD_HASH]
  });
}
