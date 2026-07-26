import { Router } from "express";
import bcrypt from "bcryptjs";
import { client, rowToObject, rowsToObjects } from "../db.js";
import { isValidEmail } from "../validate.js";
import { logAction } from "../audit.js";

export const usersRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const ROLES = ["admin", "viewer"];

function serializeUser(u) {
  return { id: u.id, email: u.email, role: u.role, createdAt: u.created_at, updatedAt: u.updated_at };
}

async function adminCount(excludeId = null) {
  const result = excludeId
    ? await client.execute({ sql: `SELECT COUNT(*) c FROM users WHERE role = 'admin' AND id != ?`, args: [excludeId] })
    : await client.execute(`SELECT COUNT(*) c FROM users WHERE role = 'admin'`);
  return rowToObject(result).c;
}

usersRouter.get(
  "/",
  ah(async (req, res) => {
    const rows = rowsToObjects(await client.execute(`SELECT * FROM users ORDER BY created_at ASC`));
    res.json(rows.map(serializeUser));
  })
);

usersRouter.post(
  "/",
  ah(async (req, res) => {
    const { email, password, role } = req.body || {};
    const errors = {};

    if (!email || !isValidEmail(email)) errors.email = "A valid email is required";
    if (!password || password.length < 8) errors.password = "Password must be at least 8 characters";
    if (!role || !ROLES.includes(role)) errors.role = "Role must be Admin or Viewer";

    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    const existing = rowToObject(
      await client.execute({ sql: `SELECT id FROM users WHERE lower(email) = lower(?)`, args: [email.trim()] })
    );
    if (existing) return res.status(400).json({ errors: { email: "A user with this email already exists" } });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await client.execute({
      sql: `INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
      args: [email.trim().toLowerCase(), passwordHash, role]
    });

    const row = rowToObject(
      await client.execute({ sql: `SELECT * FROM users WHERE id = ?`, args: [Number(result.lastInsertRowid)] })
    );
    await logAction(req.admin.email, "user_created", { entityType: "user", entityId: row.email, details: { role } });
    res.status(201).json(serializeUser(row));
  })
);

usersRouter.put(
  "/:id",
  ah(async (req, res) => {
    const id = Number(req.params.id);
    const existing = rowToObject(await client.execute({ sql: `SELECT * FROM users WHERE id = ?`, args: [id] }));
    if (!existing) return res.status(404).json({ error: "User not found" });

    const { email, password, role } = req.body || {};
    const errors = {};

    if (email !== undefined && !isValidEmail(email)) errors.email = "A valid email is required";
    if (password !== undefined && password && password.length < 8) errors.password = "Password must be at least 8 characters";
    if (role !== undefined && !ROLES.includes(role)) errors.role = "Role must be Admin or Viewer";

    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    if (role && role !== "admin" && existing.role === "admin" && (await adminCount(id)) === 0) {
      return res.status(400).json({ error: "Cannot demote the last remaining admin" });
    }

    if (email && email.trim().toLowerCase() !== existing.email) {
      const dup = rowToObject(
        await client.execute({ sql: `SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?`, args: [email.trim(), id] })
      );
      if (dup) return res.status(400).json({ errors: { email: "A user with this email already exists" } });
    }

    const nextEmail = email ? email.trim().toLowerCase() : existing.email;
    const nextRole = role || existing.role;
    const nextPasswordHash = password ? await bcrypt.hash(password, 10) : existing.password_hash;

    await client.execute({
      sql: `UPDATE users SET email = ?, role = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [nextEmail, nextRole, nextPasswordHash, id]
    });

    const row = rowToObject(await client.execute({ sql: `SELECT * FROM users WHERE id = ?`, args: [id] }));
    await logAction(req.admin.email, "user_updated", {
      entityType: "user",
      entityId: row.email,
      details: { role: nextRole, passwordChanged: !!password }
    });
    res.json(serializeUser(row));
  })
);

usersRouter.delete(
  "/:id",
  ah(async (req, res) => {
    const id = Number(req.params.id);
    const existing = rowToObject(await client.execute({ sql: `SELECT * FROM users WHERE id = ?`, args: [id] }));
    if (!existing) return res.status(404).json({ error: "User not found" });

    if (id === req.admin.userId) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    if (existing.role === "admin" && (await adminCount(id)) === 0) {
      return res.status(400).json({ error: "Cannot delete the last remaining admin" });
    }

    await client.execute({ sql: `DELETE FROM users WHERE id = ?`, args: [id] });
    await logAction(req.admin.email, "user_deleted", { entityType: "user", entityId: existing.email });
    res.json({ ok: true });
  })
);
