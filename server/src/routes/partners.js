import { Router } from "express";
import { nanoid } from "nanoid";
import { client, rowToObject, rowsToObjects } from "../db.js";
import { PARTNER_TYPES, US_STATES, COUNTRY_CODES } from "../constants.js";
import {
  isValidEmail,
  isValidPhone,
  isValidZip,
  isPartnerIdAvailable,
  isRepresentativeIdAvailable,
  hasExactDuplicate
} from "../validate.js";

export const partnersRouter = Router();

const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

partnersRouter.get("/meta", (req, res) => {
  res.json({ partnerTypes: PARTNER_TYPES, states: US_STATES, countryCodes: COUNTRY_CODES });
});

partnersRouter.post(
  "/validate",
  ah(async (req, res) => {
    const { partnerId, representativeId, contactEmail, partnerName, street1, phoneNumber, zipCode, countryCode } =
      req.body || {};

    res.json({
      partnerIdAvailable: partnerId ? await isPartnerIdAvailable(partnerId) : null,
      representativeIdAvailable: representativeId ? await isRepresentativeIdAvailable(representativeId) : null,
      emailValid: contactEmail ? isValidEmail(contactEmail) : null,
      phoneValid: phoneNumber ? isValidPhone(phoneNumber) : null,
      zipValid: zipCode ? isValidZip(zipCode, countryCode || "US") : null,
      duplicateFound: partnerName && street1 ? await hasExactDuplicate(partnerName, street1) : null
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
    createdAt: row.created_at
  };
}

partnersRouter.get(
  "/",
  ah(async (req, res) => {
    const search = (req.query.search || "").trim();
    const result = search
      ? await client.execute({
          sql: `SELECT * FROM partners WHERE lower(partner_name) LIKE lower(?) OR lower(partner_id) LIKE lower(?) ORDER BY created_at DESC`,
          args: [`%${search}%`, `%${search}%`]
        })
      : await client.execute(`SELECT * FROM partners ORDER BY created_at DESC`);

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
  "/:partnerId",
  ah(async (req, res) => {
    const row = rowToObject(
      await client.execute({ sql: `SELECT * FROM partners WHERE partner_id = ?`, args: [req.params.partnerId] })
    );
    if (!row) return res.status(404).json({ error: "Partner not found" });

    const representatives = rowsToObjects(
      await client.execute({
        sql: `SELECT * FROM representatives WHERE partner_pk = ? ORDER BY is_primary DESC, created_at ASC`,
        args: [row.id]
      })
    ).map((r) => ({
      representativeId: r.representative_id,
      firstName: r.first_name,
      lastName: r.last_name,
      isPrimary: !!r.is_primary,
      createdAt: r.created_at
    }));

    const leads = rowsToObjects(
      await client.execute({ sql: `SELECT * FROM leads WHERE partner_pk = ? ORDER BY submitted_at DESC`, args: [row.id] })
    ).map((l) => ({
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

partnersRouter.post(
  "/",
  ah(async (req, res) => {
    const b = req.body || {};
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

    if (!Array.isArray(b.representatives) || b.representatives.length === 0) {
      errors.representatives = "At least one representative is required";
    } else {
      b.representatives.forEach((r, i) => {
        if (!r.representativeId || !String(r.representativeId).trim())
          errors[`representatives.${i}.representativeId`] = "Required";
        if (!r.firstName || !String(r.firstName).trim()) errors[`representatives.${i}.firstName`] = "Required";
        if (!r.lastName || !String(r.lastName).trim()) errors[`representatives.${i}.lastName`] = "Required";
      });
    }

    if (b.contactEmail && !isValidEmail(b.contactEmail)) errors.contactEmail = "Invalid email format";
    if (b.phoneNumber && !isValidPhone(b.phoneNumber)) errors.phoneNumber = "Invalid phone number";
    if (b.zipCode && b.countryCode && !isValidZip(b.zipCode, b.countryCode)) errors.zipCode = "Invalid ZIP code";
    if (b.partnerType && !PARTNER_TYPES.includes(b.partnerType)) errors.partnerType = "Invalid partner type";

    if (Object.keys(errors).length === 0) {
      if (!(await isPartnerIdAvailable(b.partnerId))) errors.partnerId = "Partner ID already in use";
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
          street1, street2, city, state, zip_code, country_code, form_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          b.partnerId.trim(),
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
          formToken
        ]
      });

      const partnerPk = Number(partnerResult.lastInsertRowid);

      for (const r of b.representatives) {
        await tx.execute({
          sql: `INSERT INTO representatives (partner_pk, representative_id, first_name, last_name, is_primary)
                VALUES (?, ?, ?, ?, ?)`,
          args: [partnerPk, r.representativeId.trim(), r.firstName.trim(), r.lastName.trim(), r.isPrimary ? 1 : 0]
        });
      }

      await tx.commit();

      const row = rowToObject(await client.execute({ sql: `SELECT * FROM partners WHERE id = ?`, args: [partnerPk] }));
      res.status(201).json(serializePartner(row));
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  })
);
