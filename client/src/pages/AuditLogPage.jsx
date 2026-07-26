import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function AuditLogPage() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const params = { search, dateFrom, dateTo };

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .listAuditLog(params)
        .then(setEntries)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFrom, dateTo]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Login activity and admin changes to Partners and Users</p>
        </div>
        <div className="page-header-actions">
          <a className="btn btn-secondary" href={api.auditLogExportUrl(params)}>
            Export CSV
          </a>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
        <input
          className="search-input"
          aria-label="Search audit log"
          placeholder="Search by actor, action, or entity"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="field">
          <label htmlFor="audit-date-from">From</label>
          <input id="audit-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="audit-date-to">To</label>
          <input id="audit-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">No activity found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td>{entry.actorEmail || "—"}</td>
                  <td>{entry.action}</td>
                  <td>
                    {entry.entityType ? (
                      <>
                        {entry.entityType}: {entry.entityId}
                      </>
                    ) : (
                      "—"
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
