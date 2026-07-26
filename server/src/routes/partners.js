import { Router } from "express";
import { nanoid } from "nanoid";
import { client, rowToObject, rowsToObjects } from "../db.js";
import { PARTNER_TYPES, US_STATES, COUNTRY_CODES } from "../constants.js";
import { sendCsv } from "../csv.js";
import { requireAdmin } from "../auth.js";
import { logAction } from "../audit.js";
import {
  isValidEmail,
  isValidPhone,
  isValidZip,
  isPartnerIdAvailable,
  isRepresentativeIdAvailable,
  hasExactDuplicate,
  normalizeId
} from "../validate.js";

export const partnersRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

partnersRouter.get("/meta", (req, res) => {
  res.json({ partnerTypes: PARTNER_TYPES, states: US_STATES, countryCodes: COUNTRY_CODES });
});

partnersRouter.post(
  "/validate",
  ah(async (req, res) => {
    const {
      partnerId,
      representativeId,
      contactEmail,
      partnerName,
      street1,
      phoneNumber,
      zipCode,
      countryCode,
      excludePartnerId,
      excludeRepresentativeId
    } = req.body || {};

    let excludePk = null;
    if (excludePartnerId) {
      const row = await fetchPartnerRow(normalizeId(excludePartnerId));
      excludePk = row ? row.id : null;
    }

    const normalizedRepId = representativeId ? normalizeId(representativeId) : null;
    const repIdIsUnchanged =
      normalizedRepId && excludeRepresentativeId && normalizedRepId === normalizeId(excludeRepresentativeId);

    res.json({
      partnerIdAvailable: partnerId ? await isPartnerIdAvailable(normalizeId(partnerId), excludePk) : null,
      representativeIdAvailable: normalizedRepId
        ? repIdIsUnchanged || (await isRepresentativeIdAvailable(normalizedRepId))
        : null,
      emailValid: contactEmail ? isValidEmail(contactEmail) : null,
      phoneValid: phoneNumber ? isValidPhone(phoneNumber) : null,
      zipValid: zipCode ? isValidZip(zipCode, countryCode || "US") : null,
      duplicateFound: partnerName && street1 ? await hasExactDuplicate(partnerName, street1, excludePk) : null
    });
  })
);

function serializePartner(row) {
  return {
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    partnerType: row.partner_type,
    contactFirstName: row.contact_first_name,
    contactLastName: row.contact_last_name,
    contactEmail: row.contact_email,
    phoneNumber: row.phone_number,
    street1: row.street1,
    street2: row.street2,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    countryCode: row.country_code,
    formToken: row.form_token,
    formLink: `/form/${row.form_token}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by
  };
}

function serializeRep(r) {
  return {
    representativeId: r.representative_id,
    firstName: r.first_name,
    lastName: r.last_name,
    isPrimary: !!r.is_primary,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    createdBy: r.created_by,
    updatedBy: r.updated_by
  };
}

async function fetchPartnerRow(partnerId) {
  return rowToObject(await client.execute({ sql: `SELECT * FROM partners WHERE partner_id = ?`, args: [partnerId] }));
}

async function fetchRepresentatives(partnerPk) {
  return rowsToObjects(
    await client.execute({
      sql: `SELECT * FROM representatives WHERE partner_pk = ? ORDER BY is_primary DESC, created_at ASC`,
      args: [partnerPk]
    })
  );
}

async function fetchLeads(partnerPk) {
  return rowsToObjects(
    await client.execute({ sql: `SELECT * FROM leads WHERE partner_pk = ? ORDER BY submitted_at DESC`, args: [partnerPk] })
  );
}

function buildListQuery({ search, partnerType }) {
  const clauses = [];
  const args = [];

  if (search) {
    clauses.push(`(
      lower(partner_name) LIKE lower(?) OR
      lower(partner_id) LIKE lower(?) OR
      lower(contact_first_name || ' ' || contact_last_name) LIKE lower(?) OR
      lower(contact_email) LIKE lower(?)
    )`);
    const pattern = `%${search}%`;
    args.push(pattern, pattern, pattern, pattern);
  }

  if (partnerType) {
    clauses.push(`partner_type = ?`);
    args.push(partnerType);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return { where, args };
}

partnersRouter.get(
  "/",
  ah(async (req, res) => {
    const search = (req.query.search || "").trim();
    const partnerType = (req.query.partnerType || "").trim();
    const { where, args } = buildListQuery({ search, partnerType });

    const result = await client.execute({
      sql: `SELECT * FROM partners ${where} ORDER BY created_at DESC`,
      args
    });

    const rows = rowsToObjects(result);
    const out = [];
    for (const row of rows) {
      const repCount = rowToObject(
        await client.execute({ sql: `SELECT COUNT(*) c FROM representatives WHERE partner_pk = ?`, args: [row.id] })
      ).c;
      const leadCount = rowToObject(
        await client.execute({ sql: `SELECT COUNT(*) c FROM leads WHERE partner_pk = ?`, args: [row.id] })
      ).c;
      out.push({ ...serializePartner(row), representativeCount: repCount, leadCount: leadCount });
    }

    res.json(out);
  })
);

partnersRouter.get(
  "/export",
  ah(async (req, res) => {
    const search = (req.query.search || "").trim();
    const partnerType = (req.query.partnerType || "").trim();
    const { where, args } = buildListQuery({ search, partnerType });

    const rows = rowsToObjects(
      await client.execute({ sql: `SELECT * FROM partners ${where} ORDER BY created_at DESC`, args })
    );

    const out = [];
    for (const row of rows) {
      const repCount = rowToObject(
        await client.execute({ sql: `SELECT COUNT(*) c FROM representatives WHERE partner_pk = ?`, args: [row.id] })
      ).c;
      const leadCount = rowToObject(
        await client.execute({ sql: `SELECT COUNT(*) c FROM leads WHERE partner_pk = ?`, args: [row.id] })
      ).c;
      out.push({ ...serializePartner(row), representativeCount: repCount, leadCount });
    }

    sendCsv(
      res,
      "partners.csv",
      [
        { key: "partnerId", label: "Partner ID" },
        { key: "partnerName", label: "Partner Name" },
        { key: "partnerType", label: "Partner Type" },
        { key: "contactFirstName", label: "Contact First Name" },
        { key: "contactLastName", label: "Contact Last Name" },
        { key: "contactEmail", label: "Contact Email" },
        { key: "phoneNumber", label: "Phone Number" },
        { key: "street1", label: "Street 1" },
        { key: "street2", label: "Street 2" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "zipCode", label: "ZIP Code" },
        { key: "countryCode", label: "Country Code" },
        { key: "representativeCount", label: "Representatives" },
        { key: "leadCount", label: "Leads" },
        { key: "createdAt", label: "Created At" },
        { key: "createdBy", label: "Created By" },
        { key: "updatedAt", label: "Updated At" },
        { key: "updatedBy", label: "Updated By" }
      ],
      out
    );
  })
);

partnersRouter.get(
  "/:partnerId",
  ah(async (req, res) => {
    const row = await fetchPartnerRow(req.params.partnerId);
    if (!row) return res.status(404).json({ error: "Partner not found" });

    const representatives = (await fetchRepresentatives(row.id)).map(serializeRep);
    const leads = (await fetchLeads(row.id)).map((l) => ({
      id: l.id,
      firstName: l.first_name,
      lastName: l.last_name,
      email: l.email,
      phone: l.phone,
      message: l.message,
      submittedAt: l.submitted_at
    }));

    res.json({ ...serializePartner(row), representatives, leads });
  })
);

function validatePartnerPayload(b, { requireRepresentatives }) {
  const errors = {};

  const required = {
    partnerId: b.partnerId,
    partnerType: b.partnerType,
    partnerName: b.partnerName,
    contactFirstName: b.contactFirstName,
    contactLastName: b.contactLastName,
    contactEmail: b.contactEmail,
    street1: b.street1,
    city: b.city,
    state: b.state,
    zipCode: b.zipCode,
    countryCode: b.countryCode
  };
  for (const [key, value] of Object.entries(required)) {
    if (!value || !String(value).trim()) errors[key] = "Required";
  }

  if (requireRepresentatives && (!Array.isArray(b.representatives) || b.representatives.length === 0)) {
    errors.representatives = "At least one representative is required";
  } else if (Array.isArray(b.representatives)) {
    b.representatives.forEach((r, i) => {
      if (!r.representativeId || !String(r.representativeId).trim())
        errors[`representatives.${i}.representativeId`] = "Required";
      if (!r.firstName || !String(r.firstName).trim()) errors[`representatives.${i}.firstName`] = "Required";
      if (!r.lastName || !String(r.lastName).trim()) errors[`representatives.${i}.lastName`] = "Required";
    });

    const primaryCount = b.representatives.filter((r) => r.isPrimary).length;
    if (b.representatives.length > 0 && primaryCount !== 1) {
      errors.representatives = "Exactly one Representative must be marked Primary";
    }
  }

  if (b.contactEmail && !isValidEmail(b.contactEmail)) errors.contactEmail = "Invalid email format";
  if (b.phoneNumber && !isValidPhone(b.phoneNumber)) errors.phoneNumber = "Invalid phone number";
  if (b.zipCode && b.countryCode && !isValidZip(b.zipCode, b.countryCode)) errors.zipCode = "Invalid ZIP code";
  if (b.partnerType && !PARTNER_TYPES.includes(b.partnerType)) errors.partnerType = "Invalid partner type";

  return errors;
}

partnersRouter.post(
  "/",
  requireAdmin,
  ah(async (req, res) => {
    const b = req.body || {};
    b.partnerId = normalizeId(b.partnerId);
    if (Array.isArray(b.representatives)) {
      b.representatives.forEach((r) => {
        r.representativeId = normalizeId(r.representativeId);
      });
    }

    const errors = validatePartnerPayload(b, { requireRepresentatives: true });

    if (Object.keys(errors).length === 0) {
      if (!(await isPartnerIdAvailable(b.partnerId))) errors.partnerId = "Partner ID already in use";
      if (await hasExactDuplicate(b.partnerName, b.street1)) {
        errors.partnerName = "A Partner with this exact Name and Street 1 already exists";
      }
      const seen = new Set();
      for (let i = 0; i < b.representatives.length; i++) {
        const r = b.representatives[i];
        if (seen.has(r.representativeId)) {
          errors[`representatives.${i}.representativeId`] = "Duplicate in this submission";
        }
        seen.add(r.representativeId);
        if (!(await isRepresentativeIdAvailable(r.representativeId))) {
          errors[`representatives.${i}.representativeId`] = "Representative ID already in use";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const formToken = nanoid(16);
    const tx = await client.transaction("write");
    try {
      const partnerResult = await tx.execute({
        sql: `INSERT INTO partners (
          partner_id, partner_name, partner_type,
          contact_first_name, contact_last_name, contact_email, phone_number,
          street1, street2, city, state, zip_code, country_code, form_token,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          b.partnerId,
          b.partnerName.trim(),
          b.partnerType,
          b.contactFirstName.trim(),
          b.contactLastName.trim(),
          b.contactEmail.trim(),
          b.phoneNumber ? b.phoneNumber.trim() : null,
          b.street1.trim(),
          b.street2 ? b.street2.trim() : null,
          b.city.trim(),
          b.state,
          b.zipCode.trim(),
          b.countryCode,
          formToken,
          req.admin.email,
          req.admin.email
        ]
      });

      const partnerPk = Number(partnerResult.lastInsertRowid);

      for (const r of b.representatives) {
        await tx.execute({
          sql: `INSERT INTO representatives (partner_pk, representative_id, first_name, last_name, is_primary, created_by, updated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            partnerPk,
            r.representativeId,
            r.firstName.trim(),
            r.lastName.trim(),
            r.isPrimary ? 1 : 0,
            req.admin.email,
            req.admin.email
          ]
        });
      }

      await tx.commit();

      const row = rowToObject(await client.execute({ sql: `SELECT * FROM partners WHERE id = ?`, args: [partnerPk] }));
      await logAction(req.admin.email, "partner_created", { entityType: "partner", entityId: row.partner_id });
      res.status(201).json(serializePartner(row));
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  })
);

partnersRouter.put(
  "/:partnerId",
  requireAdmin,
  ah(async (req, res) => {
    const existing = await fetchPartnerRow(req.params.partnerId);
    if (!existing) return res.status(404).json({ error: "Partner not found" });

    const b = req.body || {};
    b.partnerId = normalizeId(b.partnerId);
    const representatives = Array.isArray(b.representatives) ? b.representatives : [];
    representatives.forEach((r) => {
      r.representativeId = normalizeId(r.representativeId);
    });

    const errors = validatePartnerPayload(b, { requireRepresentatives: true });

    if (Object.keys(errors).length === 0) {
      if (b.partnerId !== existing.partner_id && !(await isPartnerIdAvailable(b.partnerId, existing.id))) {
        errors.partnerId = "Partner ID already in use";
      }
      if (await hasExactDuplicate(b.partnerName, b.street1, existing.id)) {
        errors.partnerName = "A Partner with this exact Name and Street 1 already exists";
      }
      const seen = new Set();
      for (let i = 0; i < representatives.length; i++) {
        const r = representatives[i];
        if (seen.has(r.representativeId)) {
          errors[`representatives.${i}.representativeId`] = "Duplicate in this submission";
        }
        seen.add(r.representativeId);

        // Only check global availability when this is a new representative,
        // or an existing one whose ID is actually being changed.
        const idUnchanged = r.originalRepresentativeId && r.originalRepresentativeId === r.representativeId;
        if (!idUnchanged && !(await isRepresentativeIdAvailable(r.representativeId))) {
          errors[`representatives.${i}.representativeId`] = "Representative ID already in use";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const tx = await client.transaction("write");
    try {
      await tx.execute({
        sql: `UPDATE partners SET
          partner_id = ?, partner_name = ?, partner_type = ?,
          contact_first_name = ?, contact_last_name = ?, contact_email = ?, phone_number = ?,
          street1 = ?, street2 = ?, city = ?, state = ?, zip_code = ?, country_code = ?,
          updated_at = datetime('now'), updated_by = ?
          WHERE id = ?`,
        args: [
          b.partnerId,
          b.partnerName.trim(),
          b.partnerType,
          b.contactFirstName.trim(),
          b.contactLastName.trim(),
          b.contactEmail.trim(),
          b.phoneNumber ? b.phoneNumber.trim() : null,
          b.street1.trim(),
          b.street2 ? b.street2.trim() : null,
          b.city.trim(),
          b.state,
          b.zipCode.trim(),
          b.countryCode,
          req.admin.email,
          existing.id
        ]
      });

      const existingReps = rowsToObjects(
        await tx.execute({ sql: `SELECT * FROM representatives WHERE partner_pk = ?`, args: [existing.id] })
      );
      const existingById = new Map(existingReps.map((r) => [r.representative_id, r]));
      const keepOriginalIds = new Set(
        representatives.map((r) => r.originalRepresentativeId).filter(Boolean)
      );

      // Representatives present in the DB but absent from the submitted set
      // were explicitly removed by the admin (the UI requires confirmation
      // before dropping an existing representative row).
      for (const existingRep of existingReps) {
        if (!keepOriginalIds.has(existingRep.representative_id)) {
          await tx.execute({ sql: `DELETE FROM representatives WHERE id = ?`, args: [existingRep.id] });
        }
      }

      for (const r of representatives) {
        const original = r.originalRepresentativeId ? existingById.get(r.originalRepresentativeId) : null;
        if (original) {
          await tx.execute({
            sql: `UPDATE representatives SET
              representative_id = ?, first_name = ?, last_name = ?, is_primary = ?, updated_at = datetime('now'), updated_by = ?
              WHERE id = ?`,
            args: [r.representativeId, r.firstName.trim(), r.lastName.trim(), r.isPrimary ? 1 : 0, req.admin.email, original.id]
          });
        } else {
          await tx.execute({
            sql: `INSERT INTO representatives (partner_pk, representative_id, first_name, last_name, is_primary, created_by, updated_by)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              existing.id,
              r.representativeId,
              r.firstName.trim(),
              r.lastName.trim(),
              r.isPrimary ? 1 : 0,
              req.admin.email,
              req.admin.email
            ]
          });
        }
      }

      await tx.commit();

      const row = rowToObject(await client.execute({ sql: `SELECT * FROM partners WHERE id = ?`, args: [existing.id] }));
      const reps = (await fetchRepresentatives(existing.id)).map(serializeRep);
      await logAction(req.admin.email, "partner_updated", { entityType: "partner", entityId: row.partner_id });
      res.json({ ...serializePartner(row), representatives: reps });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  })
);
