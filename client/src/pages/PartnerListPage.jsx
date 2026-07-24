import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

export default function PartnerListPage() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .listPartners(search)
        .then(setPartners)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Partners</h1>
          <p className="page-subtitle">All onboarded partners and their representatives</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate("/partners/new")}>
            + Add Partner
          </button>
        </div>
      </div>

      <input
        className="search-input"
        placeholder="Search by Partner ID or Name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 18 }}
      />

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : partners.length === 0 ? (
          <div className="empty-state">
            No partners found.{" "}
            <button className="btn-link" onClick={() => navigate("/partners/new")}>
              Add your first partner
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Partner ID</th>
                <th>Partner Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Representatives</th>
                <th>Leads</th>
                <th>Created</th>
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
                  <td>
                    {p.city}, {p.state}
                  </td>
                  <td>{p.representativeCount}</td>
                  <td>{p.leadCount}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
