import { client } from "./db.js";

export async function logAction(actorEmail, action, { entityType, entityId, details } = {}) {
  await client.execute({
    sql: `INSERT INTO audit_log (actor_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)`,
    args: [actorEmail || null, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null]
  });
}
