import { Router } from "express";
import bcrypt from "bcryptjs";
import { client, rowToObject } from "../db.js";
import { signSessionToken, setSessionCookie, clearSessionCookie, getCurrentUser, requireAuth } from "../auth.js";
import { logAction } from "../audit.js";

export const authRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

authRouter.post(
  "/login",
  ah(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = rowToObject(
      await client.execute({ sql: `SELECT * FROM users WHERE lower(email) = lower(?)`, args: [email.trim()] })
    );
    const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !passwordMatches) {
      await logAction(email.trim().toLowerCase(), "login_failed");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signSessionToken(user);
    setSessionCookie(res, token);
    await logAction(user.email, "login");
    res.json({ email: user.email, role: user.role });
  })
);

authRouter.post(
  "/logout",
  requireAuth,
  ah(async (req, res) => {
    clearSessionCookie(res);
    await logAction(req.admin.email, "logout");
    res.json({ ok: true });
  })
);

authRouter.get(
  "/session",
  ah(async (req, res) => {
    const admin = await getCurrentUser(req);
    res.json(admin ? { authenticated: true, email: admin.email, role: admin.role } : { authenticated: false });
  })
);
