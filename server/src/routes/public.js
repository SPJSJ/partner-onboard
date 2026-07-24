import { Router } from "express";
import { client, rowToObject } from "../db.js";
import { isValidEmail, isValidPhone } from "../validate.js";

export const publicRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

async function findPartnerByToken(token) {
  return rowToObject(await client.execute({ sql: `SELECT * FROM partners WHERE form_token = ?`, args: [token] }));
}

publicRouter.get(
  "/form/:token",
  ah(async (req, res) => {
    const partner = await findPartnerByToken(req.params.token);
    if (!partner) return res.status(404).json({ error: "This form link is invalid or has expired." });
    res.json({ partnerId: partner.partner_id, partnerName: partner.partner_name });
  })
);

publicRouter.post(
  "/form/:token",
  ah(async (req, res) => {
    const partner = await findPartnerByToken(req.params.token);
    if (!partner) return res.status(404).json({ error: "This form link is invalid or has expired." });

    const b = req.body || {};
    const errors = {};
    if (!b.firstName || !b.firstName.trim()) errors.firstName = "Required";
    if (!b.lastName || !b.lastName.trim()) errors.lastName = "Required";
    if (!b.email || !b.email.trim()) errors.email = "Required";
    else if (!isValidEmail(b.email)) errors.email = "Invalid email format";
    if (b.phone && !isValidPhone(b.phone)) errors.phone = "Invalid phone number";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    await client.execute({
      sql: `INSERT INTO leads (partner_pk, first_name, last_name, email, phone, message) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        partner.id,
        b.firstName.trim(),
        b.lastName.trim(),
        b.email.trim(),
        b.phone ? b.phone.trim() : null,
        b.message ? b.message.trim() : null
      ]
    });

    res.status(201).json({ ok: true });
  })
);
