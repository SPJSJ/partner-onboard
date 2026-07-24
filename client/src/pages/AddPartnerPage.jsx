import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { TextField, SelectField } from "../components/Field.jsx";
import ValidationPanel from "../components/ValidationPanel.jsx";

const emptyForm = {
  partnerId: "",
  partnerType: "",
  partnerName: "",
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  phoneNumber: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
  countryCode: "US"
};

const emptyRep = () => ({ representativeId: "", firstName: "", lastName: "", isPrimary: false });

export default function AddPartnerPage() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ partnerTypes: [], states: [], countryCodes: [] });
  const [form, setForm] = useState(emptyForm);
  const [representatives, setRepresentatives] = useState([{ ...emptyRep(), isPrimary: true }]);
  const [errors, setErrors] = useState({});
  const [validation, setValidation] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    api.getMeta().then(setMeta).catch(() => {});
  }, []);

  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const hasAny =
        form.partnerId || form.contactEmail || form.partnerName || form.street1 || representatives[0]?.representativeId;
      if (!hasAny) return;
      api
        .validatePartner({
          partnerId: form.partnerId,
          representativeId: representatives[0]?.representativeId,
          contactEmail: form.contactEmail,
          partnerName: form.partnerName,
          street1: form.street1,
          phoneNumber: form.phoneNumber,
          zipCode: form.zipCode,
          countryCode: form.countryCode
        })
        .then(setValidation)
        .catch(() => {});
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.partnerId, form.contactEmail, form.partnerName, form.street1, form.phoneNumber, form.zipCode, form.countryCode, representatives[0]?.representativeId]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateRep(index, key, value) {
    setRepresentatives((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function setPrimary(index) {
    setRepresentatives((prev) => prev.map((r, i) => ({ ...r, isPrimary: i === index })));
  }

  function addRepresentative() {
    setRepresentatives((prev) => [...prev, emptyRep()]);
  }

  function removeRepresentative(index) {
    setRepresentatives((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    setSubmitting(true);
    try {
      const created = await api.createPartner({ ...form, representatives });
      navigate(`/partners/${encodeURIComponent(created.partnerId)}`, { state: { justCreated: true } });
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
        setServerError("Please fix the highlighted fields before saving.");
      } else {
        setServerError(err.message || "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(key) {
    return errors[key];
  }

  return (
    <div className="page">
      <form onSubmit={handleSubmit}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Add Partner</h1>
            <p className="page-subtitle">Create a Partner and its first Representative</p>
          </div>
          <div className="page-header-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/partners")}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Partner"}
            </button>
          </div>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <div className="form-grid">
          <div>
            <div className="card">
              <div className="card-title">Partner details</div>
              <hr className="card-divider" />
              <div className="field-row">
                <TextField
                  label="Partner ID"
                  required
                  value={form.partnerId}
                  onChange={(e) => updateField("partnerId", e.target.value)}
                  error={fieldError("partnerId")}
                  placeholder="P2007"
                />
                <SelectField
                  label="Partner Type"
                  required
                  value={form.partnerType}
                  onChange={(e) => updateField("partnerType", e.target.value)}
                  error={fieldError("partnerType")}
                >
                  <option value="">Select a type</option>
                  {meta.partnerTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="field-row single">
                <TextField
                  label="Partner Name"
                  required
                  value={form.partnerName}
                  onChange={(e) => updateField("partnerName", e.target.value)}
                  error={fieldError("partnerName")}
                  placeholder="North Bay Dental Lab"
                />
              </div>

              <div className="card-title" style={{ marginTop: 6 }}>
                Contact information
              </div>
              <hr className="card-divider" />
              <div className="field-row">
                <TextField
                  label="Contact First Name"
                  required
                  value={form.contactFirstName}
                  onChange={(e) => updateField("contactFirstName", e.target.value)}
                  error={fieldError("contactFirstName")}
                />
                <TextField
                  label="Contact Last Name"
                  required
                  value={form.contactLastName}
                  onChange={(e) => updateField("contactLastName", e.target.value)}
                  error={fieldError("contactLastName")}
                />
              </div>
              <div className="field-row">
                <TextField
                  label="Contact Email"
                  required
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  error={fieldError("contactEmail")}
                />
                <TextField
                  label="Phone Number"
                  value={form.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  error={fieldError("phoneNumber")}
                  placeholder="415 555 0186"
                />
              </div>

              <div className="card-title" style={{ marginTop: 6 }}>
                Billing address
              </div>
              <hr className="card-divider" />
              <div className="field-row">
                <TextField
                  label="Street 1"
                  required
                  value={form.street1}
                  onChange={(e) => updateField("street1", e.target.value)}
                  error={fieldError("street1")}
                />
                <TextField
                  label="Street 2"
                  value={form.street2}
                  onChange={(e) => updateField("street2", e.target.value)}
                  error={fieldError("street2")}
                />
              </div>
              <div className="field-row three">
                <TextField
                  label="City"
                  required
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  error={fieldError("city")}
                />
                <SelectField
                  label="State"
                  required
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  error={fieldError("state")}
                >
                  <option value="">Select a state</option>
                  {meta.states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </SelectField>
                <TextField
                  label="ZIP Code"
                  required
                  value={form.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                  error={fieldError("zipCode")}
                />
              </div>
              <div className="field-row single">
                <SelectField
                  label="Country Code"
                  required
                  value={form.countryCode}
                  onChange={(e) => updateField("countryCode", e.target.value)}
                  error={fieldError("countryCode")}
                >
                  {meta.countryCodes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-title">Representative details</div>
              <hr className="card-divider" />

              {representatives.map((rep, index) => (
                <div className="rep-block" key={index}>
                  {representatives.length > 1 && (
                    <div className="rep-block-header">
                      <span className="rep-block-title">Representative {index + 1}</span>
                      <button type="button" className="btn-danger-text" onClick={() => removeRepresentative(index)}>
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="field-row single">
                    <TextField
                      label="Representative ID"
                      required
                      value={rep.representativeId}
                      onChange={(e) => updateRep(index, "representativeId", e.target.value)}
                      error={fieldError(`representatives.${index}.representativeId`)}
                      placeholder="R3013"
                    />
                  </div>
                  <div className="field-row">
                    <TextField
                      label="First Name"
                      required
                      value={rep.firstName}
                      onChange={(e) => updateRep(index, "firstName", e.target.value)}
                      error={fieldError(`representatives.${index}.firstName`)}
                    />
                    <TextField
                      label="Last Name"
                      required
                      value={rep.lastName}
                      onChange={(e) => updateRep(index, "lastName", e.target.value)}
                      error={fieldError(`representatives.${index}.lastName`)}
                    />
                  </div>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={rep.isPrimary} onChange={() => setPrimary(index)} />
                    Primary Representative
                  </label>
                </div>
              ))}

              <button type="button" className="btn btn-secondary" onClick={addRepresentative}>
                + Add Another Representative
              </button>
            </div>

            <ValidationPanel validation={validation} />
          </div>
        </div>
      </form>
    </div>
  );
}
