import jwt from "jsonwebtoken";

const COOKIE_NAME = "pob_session";
const SESSION_TTL = "12h";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function signSessionToken(email) {
  return jwt.sign({ email }, requiredEnv("SESSION_SECRET"), { expiresIn: SESSION_TTL });
}

export function verifySessionToken(token) {
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

export function getSessionFromRequest(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

export function requireAuth(req, res, next) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.admin = session;
  next();
}
