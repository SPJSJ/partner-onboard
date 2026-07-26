import { Router } from "express";
import { client, rowsToObjects } from "../db.js";
import { sendCsv } from "../csv.js";

export const auditLogRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function buildQuery({ search, dateFrom, dateTo }) {
  const clauses = [];
  const args = [];

  if (search) {
    clauses.push(`(
      lower(actor_email) LIKE lower(?) OR
      lower(action) LIKE lower(?) OR
      lower(entity_id) LIKE lower(?)
    )`);
    const pattern = `%${search}%`;
    args.push(pattern, pattern, pattern);
  }
  if (dateFrom) {
    clauses.push(`substr(created_at, 1, 10) >= ?`);
    args.push(dateFrom);
  }
  if (dateTo) {
    clauses.push(`substr(created_at, 1, 10) <= ?`);
    args.push(dateTo);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, args };
}

function serialize(row) {
  return {
    id: row.id,
    actorEmail: row.actor_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
    createdAt: row.created_at
  };
}

auditLogRouter.get(
  "/",
  ah(async (req, res) => {
    const search = (req.query.search || "").trim();
    const dateFrom = (req.query.dateFrom || "").trim();
    const dateTo = (req.query.dateTo || "").trim();
    const { where, args } = buildQuery({ search, dateFrom, dateTo });

    const rows = rowsToObjects(
      await client.execute({ sql: `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT 500`, args })
    );
    res.json(rows.map(serialize));
  })
);

auditLogRouter.get(
  "/export",
  ah(async (req, res) => {
    const search = (req.query.search || "").trim();
    const dateFrom = (req.query.dateFrom || "").trim();
    const dateTo = (req.query.dateTo || "").trim();
    const { where, args } = buildQuery({ search, dateFrom, dateTo });

    const rows = rowsToObjects(
      await client.execute({ sql: `SELECT * FROM audit_log ${where} ORDER BY created_at DESC`, args })
    ).map(serialize);

    sendCsv(
      res,
      "audit-log.csv",
      [
        { key: "createdAt", label: "Timestamp" },
        { key: "actorEmail", label: "Actor" },
        { key: "action", label: "Action" },
        { key: "entityType", label: "Entity Type" },
        { key: "entityId", label: "Entity ID" },
        { key: "details", label: "Details" }
      ],
      rows
    );
  })
);
