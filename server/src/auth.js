import jwt from "jsonwebtoken";
import { client, rowToObject } from "./db.js";

const COOKIE_NAME = "pob_session";
const SESSION_TTL = "12h";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function signSessionToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, requiredEnv("SESSION_SECRET"), { expiresIn: SESSION_TTL });
}

function verifySessionToken(token) {
  try {
    return jwt.verify(token, requiredEnv("SESSION_SECRET"));
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60 * 1000
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

// Re-fetches the user row on every request (rather than trusting a role
// embedded in the JWT) so a role change or account deletion takes effect
// immediately instead of waiting out the token's 12h lifetime.
export async function getCurrentUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  const payload = token ? verifySessionToken(token) : null;
  if (!payload) return null;

  const user = rowToObject(await client.execute({ sql: `SELECT * FROM users WHERE id = ?`, args: [payload.userId] }));
  return user ? { userId: user.id, email: user.email, role: user.role } : null;
}

export async function requireAuth(req, res, next) {
  const admin = await getCurrentUser(req);
  if (!admin) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.admin = admin;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.admin?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
