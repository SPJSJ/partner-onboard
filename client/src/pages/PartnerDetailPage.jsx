import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function PartnerDetailPage() {
  const { partnerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState("");

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {partner.partnerName} <StatusBadge status={partner.status} />
          </h1>
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

      {location.state?.justCreated && <div className="alert alert-success">Partner created successfully.</div>}
      {location.state?.justUpdated && <div className="alert alert-success">Partner updated successfully.</div>}

      <div style={{ maxWidth: 640 }}>
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
              <span className="kv-value">
                {new Date(partner.createdAt).toLocaleString()}
                {partner.createdBy && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>
                    by {partner.createdBy}
                  </div>
                )}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Last Updated</span>
              <span className="kv-value">
                {new Date(partner.updatedAt || partner.createdAt).toLocaleString()}
                {(partner.updatedBy || partner.createdBy) && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>
                    by {partner.updatedBy || partner.createdBy}
                  </div>
                )}
              </span>
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
                    {(r.updatedBy || r.createdBy) && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        last updated by {r.updatedBy || r.createdBy}
                      </div>
                    )}
                  </span>
                  <span className="kv-value">{r.representativeId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
