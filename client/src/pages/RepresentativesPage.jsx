import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function RepresentativesPage() {
  const [representatives, setRepresentatives] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .listRepresentatives({ search })
        .then(setRepresentatives)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Representatives</h1>
          <p className="page-subtitle">Every representative across every partner</p>
        </div>
      </div>

      <input
        className="search-input"
        aria-label="Search representatives"
        placeholder="Search by name, Representative ID, Partner ID, or Partner Name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 18 }}
      />

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : representatives.length === 0 ? (
          <div className="empty-state">No representatives found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Representative ID</th>
                <th>Name</th>
                <th>Partner</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {representatives.map((r) => (
                <tr key={r.representativeId}>
                  <td>{r.representativeId}</td>
                  <td>
                    {r.firstName} {r.lastName}
                    {r.isPrimary && (
                      <span className="badge badge-blue" style={{ marginLeft: 8 }}>
                        Primary
                      </span>
                    )}
                  </td>
                  <td>
                    <Link to={`/partners/${encodeURIComponent(r.partnerId)}`}>{r.partnerName}</Link>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.partnerId}</div>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
