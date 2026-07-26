import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function PartnerListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [partnerType, setPartnerType] = useState("");
  const [status, setStatus] = useState("");
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [partnerStatuses, setPartnerStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const params = { search, partnerType, status };

  useEffect(() => {
    api
      .getMeta()
      .then((m) => {
        setPartnerTypes(m.partnerTypes);
        setPartnerStatuses(m.partnerStatuses);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .listPartners(params)
        .then(setPartners)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, partnerType, status]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Partners</h1>
          <p className="page-subtitle">All onboarded partners and their representatives</p>
        </div>
        <div className="page-header-actions">
          <a className="btn btn-secondary" href={api.partnersExportUrl(params)}>
            Export CSV
          </a>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => navigate("/partners/new")}>
              + Add Partner
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          className="search-input"
          aria-label="Search partners"
          placeholder="Search by Partner ID, Name, Contact Name, or Contact Email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="search-input"
          style={{ width: 220 }}
          aria-label="Filter by Partner Type"
          value={partnerType}
          onChange={(e) => setPartnerType(e.target.value)}
        >
          <option value="">All Partner Types</option>
          {partnerTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="search-input"
          style={{ width: 180 }}
          aria-label="Filter by Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {partnerStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : partners.length === 0 ? (
          <div className="empty-state">
            No partners found.{" "}
            {isAdmin && (
              <button className="btn-link" onClick={() => navigate("/partners/new")}>
                Add your first partner
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Partner ID</th>
                <th>Partner Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Representatives</th>
                <th>Leads</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.partnerId} className="clickable" onClick={() => navigate(`/partners/${encodeURIComponent(p.partnerId)}`)}>
                  <td>{p.partnerId}</td>
                  <td>{p.partnerName}</td>
                  <td>{p.partnerType}</td>
                  <td>
                    {p.contactFirstName} {p.contactLastName}
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{p.contactEmail}</div>
                  </td>
                  <td>{p.phoneNumber || "—"}</td>
                  <td>{p.representativeCount}</td>
                  <td>{p.leadCount}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/partners/${encodeURIComponent(p.partnerId)}/edit`);
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
