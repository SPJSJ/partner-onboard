import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest
} from "../auth.js";

export const authRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

authRouter.post(
  "/login",
  ah(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "";
    const adminHash = process.env.ADMIN_PASSWORD_HASH || "";

    const emailMatches = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
    const passwordMatches = adminHash ? await bcrypt.compare(password, adminHash) : false;

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signSessionToken(adminEmail);
    setSessionCookie(res, token);
    res.json({ email: adminEmail });
  })
);

authRouter.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/session", (req, res) => {
  const session = getSessionFromRequest(req);
  res.json(session ? { authenticated: true, email: session.email } : { authenticated: false });
});
