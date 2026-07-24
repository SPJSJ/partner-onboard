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

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_pk INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function rowsToObjects(result) {
  const cols = result.columns;
  return result.rows.map((row) => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

export function rowToObject(result) {
  return rowsToObjects(result)[0] || null;
}
