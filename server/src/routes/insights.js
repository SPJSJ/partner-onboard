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

    res.json({
      totalPartners,
      totalRepresentatives,
      partnersByType: await partnersByType()
    });
  })
);

insightsRouter.get(
  "/reports",
  ah(async (req, res) => {
    res.json({
      partnersByType: await partnersByType()
    });
  })
);
