import { Router } from "express";
import { client, rowsToObjects } from "../db.js";

export const representativesRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function serialize(r) {
  return {
    representativeId: r.representative_id,
    firstName: r.first_name,
    lastName: r.last_name,
    isPrimary: !!r.is_primary,
    partnerId: r.partner_id,
    partnerName: r.partner_name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    createdBy: r.created_by,
    updatedBy: r.updated_by
  };
}

representativesRouter.get(
  "/",
  ah(async (req, res) => {
    const search = (req.query.search || "").trim();
    const clauses = [];
    const args = [];

    if (search) {
      clauses.push(`(
        lower(representatives.first_name || ' ' || representatives.last_name) LIKE lower(?) OR
        lower(representatives.representative_id) LIKE lower(?) OR
        lower(partners.partner_id) LIKE lower(?) OR
        lower(partners.partner_name) LIKE lower(?)
      )`);
      const pattern = `%${search}%`;
      args.push(pattern, pattern, pattern, pattern);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const rows = rowsToObjects(
      await client.execute({
        sql: `SELECT representatives.*, partners.partner_id AS partner_id, partners.partner_name AS partner_name
              FROM representatives
              JOIN partners ON partners.id = representatives.partner_pk
              ${where}
              ORDER BY representatives.created_at DESC`,
        args
      })
    );

    res.json(rows.map(serialize));
  })
);
