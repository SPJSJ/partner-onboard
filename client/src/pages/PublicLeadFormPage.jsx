import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { TextField } from "../components/Field.jsx";

export default function PublicLeadFormPage() {
  const { token } = useParams();
  const [partner, setPartner] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    api
      .getPublicForm(token)
      .then(setPartner)
      .catch((err) => setLoadError(err.message || "This form link is invalid."));
  }, [token]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    setSubmitting(true);
    try {
      await api.submitPublicForm(token, form);
      setSubmitted(true);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setServerError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="public-page">
        <div className="public-card">
          <div className="alert alert-error">{loadError}</div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="public-page">
        <div className="public-card">Loading...</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="public-page">
        <div className="public-card">
          <div className="alert alert-success">
            Thanks! Your information has been submitted to {partner.partnerName}. Someone will be in touch soon.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="public-card">
        <div className="public-brand">
          <div className="sidebar-logo-mark" style={{ background: "var(--navy-900)", color: "#fff" }}>
            IS
          </div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Get in touch with {partner.partnerName}</div>
        </div>

        <div className="prefill-box">
          <div className="kv-row">
            <span className="kv-label">Partner ID</span>
            <span className="kv-value">{partner.partnerId}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">Partner Name</span>
            <span className="kv-value">{partner.partnerName}</span>
          </div>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <TextField
              label="First Name"
              required
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              error={errors.firstName}
            />
            <TextField
              label="Last Name"
              required
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              error={errors.lastName}
            />
          </div>
          <div className="field-row single">
            <TextField
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              error={errors.email}
            />
          </div>
          <div className="field-row single">
            <TextField
              label="Phone Number"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              error={errors.phone}
            />
          </div>
          <div className="field-row single">
            <div className="field">
              <label>Message</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%", justifyContent: "center" }}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
