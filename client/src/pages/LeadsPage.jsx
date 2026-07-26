import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const params = { search, dateFrom, dateTo };

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .listLeads(params)
        .then(setLeads)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dateFrom, dateTo]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">Every lead submitted through a Partner's public form</p>
        </div>
        <div className="page-header-actions">
          <a className="btn btn-secondary" href={api.leadsExportUrl(params)}>
            Export CSV
          </a>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
        <input
          className="search-input"
          aria-label="Search leads"
          placeholder="Search by lead name, email, Partner ID, or Partner Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="field">
          <label htmlFor="lead-date-from">From</label>
          <input id="lead-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lead-date-to">To</label>
          <input id="lead-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="empty-state">No leads found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Message</th>
                <th>Partner</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    {lead.firstName} {lead.lastName}
                  </td>
                  <td>{lead.email}</td>
                  <td>{lead.phone || "—"}</td>
                  <td style={{ maxWidth: 260 }}>{lead.message || "—"}</td>
                  <td>
                    <Link to={`/partners/${encodeURIComponent(lead.partnerId)}`}>{lead.partnerName}</Link>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{lead.partnerId}</div>
                  </td>
                  <td>{new Date(lead.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
