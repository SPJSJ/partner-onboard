import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function PartnerDetailPage() {
  const { partnerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPartner(null);
    setError("");
    api
      .getPartner(partnerId)
      .then(setPartner)
      .catch((err) => setError(err.message || "Failed to load partner"));
  }, [partnerId]);

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate("/partners")}>
          Back to Partners
        </button>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="page">
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  const formUrl = `${window.location.origin}${partner.formLink}`;

  function copyLink() {
    navigator.clipboard.writeText(formUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{partner.partnerName}</h1>
          <p className="page-subtitle">
            Partner ID {partner.partnerId} &middot; {partner.partnerType}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate("/partners")}>
            Back to Partners
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => navigate(`/partners/${encodeURIComponent(partnerId)}/edit`)}>
              Edit Partner
            </button>
          )}
        </div>
      </div>

      {location.state?.justCreated && (
        <div className="alert alert-success">
          Partner created. Share the unique lead form link below with {partner.partnerName}.
        </div>
      )}
      {location.state?.justUpdated && <div className="alert alert-success">Partner updated successfully.</div>}

      <div className="detail-grid">
        <div>
          <div className="card">
            <div className="card-title">Partner details</div>
            <hr className="card-divider" />
            <div className="kv-list">
              <div className="kv-row">
                <span className="kv-label">Partner ID</span>
                <span className="kv-value">{partner.partnerId}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Partner Type</span>
                <span className="kv-value">{partner.partnerType}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Contact</span>
                <span className="kv-value">
                  {partner.contactFirstName} {partner.contactLastName}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Contact Email</span>
                <span className="kv-value">{partner.contactEmail}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Phone Number</span>
                <span className="kv-value">{partner.phoneNumber || "—"}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Billing Address</span>
                <span className="kv-value">
                  {partner.street1}
                  {partner.street2 ? `, ${partner.street2}` : ""}
                  <br />
                  {partner.city}, {partner.state} {partner.zipCode}
                  <br />
                  {partner.countryCode}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Created</span>
                <span className="kv-value">{new Date(partner.createdAt).toLocaleString()}</span>
              </div>
              <div className="kv-row">
                <span className="kv-label">Last Updated</span>
                <span className="kv-value">{new Date(partner.updatedAt || partner.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Representatives</div>
            <hr className="card-divider" />
            {partner.representatives.length === 0 ? (
              <div className="empty-state">No representatives on file.</div>
            ) : (
              <div className="kv-list">
                {partner.representatives.map((r) => (
                  <div className="kv-row" key={r.representativeId}>
                    <span className="kv-label">
                      {r.firstName} {r.lastName}
                      {r.isPrimary && (
                        <span className="badge badge-blue" style={{ marginLeft: 8 }}>
                          Primary
                        </span>
                      )}
                    </span>
                    <span className="kv-value">{r.representativeId}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">Unique lead form link</div>
            <hr className="card-divider" />
            <p className="source-meta">
              Anyone who opens this link sees a simple lead form with the Partner ID and Partner Name
              pre-filled. Submissions are saved below.
            </p>
            <div className="link-box">{formUrl}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={copyLink}>
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <a className="btn btn-secondary btn-sm" href={partner.formLink} target="_blank" rel="noreferrer">
                Open Form
              </a>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="card-title">
                Leads <span className="badge badge-green" style={{ marginLeft: 8 }}>{partner.leads.length}</span>
              </div>
              {partner.leads.length > 0 && (
                <a className="btn btn-secondary btn-sm" href={api.leadsExportUrl({ partnerId: partner.partnerId })}>
                  Export CSV
                </a>
              )}
            </div>
            <hr className="card-divider" />
            {partner.leads.length === 0 ? (
              <div className="empty-state">No leads submitted yet.</div>
            ) : (
              <div className="kv-list">
                {partner.leads.map((lead) => (
                  <div key={lead.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                    <div className="kv-row">
                      <span className="kv-value">
                        {lead.firstName} {lead.lastName}
                      </span>
                      <span className="kv-label">{new Date(lead.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="kv-label">{lead.email}</div>
                    {lead.phone && <div className="kv-label">{lead.phone}</div>}
                    {lead.message && <div className="kv-label" style={{ marginTop: 4 }}>{lead.message}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
