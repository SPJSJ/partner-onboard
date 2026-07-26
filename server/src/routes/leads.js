import { Router } from "express";
import { client, rowsToObjects } from "../db.js";
import { sendCsv } from "../csv.js";

export const leadsRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function buildLeadsQuery({ search, dateFrom, dateTo, partnerId }) {
  const clauses = [];
  const args = [];

  if (partnerId) {
    clauses.push(`partners.partner_id = ?`);
    args.push(partnerId);
  }

  if (search) {
    clauses.push(`(
      lower(leads.first_name || ' ' || leads.last_name) LIKE lower(?) OR
      lower(leads.email) LIKE lower(?) OR
      lower(partners.partner_id) LIKE lower(?) OR
      lower(partners.partner_name) LIKE lower(?)
    )`);
    const pattern = `%${search}%`;
    args.push(pattern, pattern, pattern, pattern);
  }

  if (dateFrom) {
    clauses.push(`substr(leads.submitted_at, 1, 10) >= ?`);
    args.push(dateFrom);
  }
  if (dateTo) {
    clauses.push(`substr(leads.submitted_at, 1, 10) <= ?`);
    args.push(dateTo);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, args };
}

function serializeLeadRow(l) {
  return {
    id: l.id,
    firstName: l.first_name,
    lastName: l.last_name,
    email: l.email,
    phone: l.phone,
    message: l.message,
    submittedAt: l.submitted_at,
    partnerId: l.partner_id,
    partnerName: l.partner_name
  };
}

leadsRouter.get(
  "/",
  ah(async (req, res) => {
    const search = (req.query.search || "").trim();
    const dateFrom = (req.query.dateFrom || "").trim();
    const dateTo = (req.query.dateTo || "").trim();
    const partnerId = (req.query.partnerId || "").trim();
    const { where, args } = buildLeadsQuery({ search, dateFrom, dateTo, partnerId });

    const rows = rowsToObjects(
      await client.execute({
        sql: `SELECT leads.*, partners.partner_id AS partner_id, partners.partner_name AS partner_name
              FROM leads
              JOIN partners ON partners.id = leads.partner_pk
              ${where}
              ORDER BY leads.submitted_at DESC`,
        args
      })
    );

    res.json(rows.map(serializeLeadRow));
  })
);

leadsRouter.get(
  "/export",
  ah(async (req, res) => {
    const search = (req.query.search || "").trim();
    const dateFrom = (req.query.dateFrom || "").trim();
    const dateTo = (req.query.dateTo || "").trim();
    const partnerId = (req.query.partnerId || "").trim();
    const { where, args } = buildLeadsQuery({ search, dateFrom, dateTo, partnerId });

    const rows = rowsToObjects(
      await client.execute({
        sql: `SELECT leads.*, partners.partner_id AS partner_id, partners.partner_name AS partner_name
              FROM leads
              JOIN partners ON partners.id = leads.partner_pk
              ${where}
              ORDER BY leads.submitted_at DESC`,
        args
      })
    ).map(serializeLeadRow);

    sendCsv(
      res,
      "leads.csv",
      [
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone Number" },
        { key: "message", label: "Message" },
        { key: "partnerId", label: "Partner ID" },
        { key: "partnerName", label: "Partner Name" },
        { key: "submittedAt", label: "Submitted At" }
      ],
      rows
    );
  })
);
