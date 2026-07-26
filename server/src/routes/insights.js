import { Router } from "express";
import { client, rowToObject, rowsToObjects } from "../db.js";

export const insightsRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

async function partnersByType() {
  return rowsToObjects(
    await client.execute(
      `SELECT partner_type AS type, COUNT(*) AS count FROM partners GROUP BY partner_type ORDER BY count DESC`
    )
  );
}

insightsRouter.get(
  "/dashboard",
  ah(async (req, res) => {
    const totalPartners = rowToObject(await client.execute(`SELECT COUNT(*) c FROM partners`)).c;
    const totalRepresentatives = rowToObject(await client.execute(`SELECT COUNT(*) c FROM representatives`)).c;
    const totalLeads = rowToObject(await client.execute(`SELECT COUNT(*) c FROM leads`)).c;
    const leadsLast7Days = rowToObject(
      await client.execute(`SELECT COUNT(*) c FROM leads WHERE submitted_at >= datetime('now', '-7 days')`)
    ).c;
    const leadsLast30Days = rowToObject(
      await client.execute(`SELECT COUNT(*) c FROM leads WHERE submitted_at >= datetime('now', '-30 days')`)
    ).c;

    const recentLeads = rowsToObjects(
      await client.execute(`
        SELECT leads.*, partners.partner_id AS partner_id, partners.partner_name AS partner_name
        FROM leads
        JOIN partners ON partners.id = leads.partner_pk
        ORDER BY leads.submitted_at DESC
        LIMIT 5
      `)
    ).map((l) => ({
      firstName: l.first_name,
      lastName: l.last_name,
      email: l.email,
      partnerId: l.partner_id,
      partnerName: l.partner_name,
      submittedAt: l.submitted_at
    }));

    res.json({
      totalPartners,
      totalRepresentatives,
      totalLeads,
      leadsLast7Days,
      leadsLast30Days,
      partnersByType: await partnersByType(),
      recentLeads
    });
  })
);

insightsRouter.get(
  "/reports",
  ah(async (req, res) => {
    const leadsByPartner = rowsToObjects(
      await client.execute(`
        SELECT partners.partner_id AS partner_id, partners.partner_name AS partner_name, COUNT(leads.id) AS lead_count
        FROM partners
        LEFT JOIN leads ON leads.partner_pk = partners.id
        GROUP BY partners.id
        ORDER BY lead_count DESC, partners.partner_name ASC
        LIMIT 25
      `)
    ).map((r) => ({ partnerId: r.partner_id, partnerName: r.partner_name, leadCount: r.lead_count }));

    const leadsByMonth = rowsToObjects(
      await client.execute(`
        SELECT substr(submitted_at, 1, 7) AS month, COUNT(*) AS count
        FROM leads
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
      `)
    );

    res.json({
      partnersByType: await partnersByType(),
      leadsByPartner,
      leadsByMonth
    });
  })
);
