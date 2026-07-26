import { client } from "./db.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;

export function isValidEmail(email) {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

export function isValidPhone(phone) {
  if (!phone) return true; // optional field
  return PHONE_RE.test(String(phone).trim());
}

export function isValidZip(zip, countryCode) {
  if (!zip) return false;
  if (countryCode === "US") return /^\d{5}(-\d{4})?$/.test(zip.trim());
  return zip.trim().length >= 3 && zip.trim().length <= 12;
}

// Business identifiers (Partner ID, Representative ID) are normalized to a
// single consistent case so "p100" and "P100" are treated as the same ID.
export function normalizeId(value) {
  return String(value || "").trim().toUpperCase();
}

export async function isPartnerIdAvailable(partnerId, excludePk = null) {
  if (!partnerId) return false;
  const result = excludePk
    ? await client.execute({ sql: "SELECT id FROM partners WHERE partner_id = ? AND id != ?", args: [partnerId, excludePk] })
    : await client.execute({ sql: "SELECT id FROM partners WHERE partner_id = ?", args: [partnerId] });
  return result.rows.length === 0;
}

export async function isRepresentativeIdAvailable(representativeId, excludePk = null) {
  if (!representativeId) return false;
  const result = excludePk
    ? await client.execute({
        sql: "SELECT id FROM representatives WHERE representative_id = ? AND id != ?",
        args: [representativeId, excludePk]
      })
    : await client.execute({ sql: "SELECT id FROM representatives WHERE representative_id = ?", args: [representativeId] });
  return result.rows.length === 0;
}

export async function hasExactDuplicate(partnerName, street1, excludePk = null) {
  if (!partnerName || !street1) return false;
  const result = excludePk
    ? await client.execute({
        sql: "SELECT id FROM partners WHERE lower(partner_name) = lower(?) AND lower(street1) = lower(?) AND id != ?",
        args: [partnerName, street1, excludePk]
      })
    : await client.execute({
        sql: "SELECT id FROM partners WHERE lower(partner_name) = lower(?) AND lower(street1) = lower(?)",
        args: [partnerName, street1]
      });
  return result.rows.length > 0;
}
