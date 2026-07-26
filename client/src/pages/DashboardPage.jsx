import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getDashboard().then(setData).catch(() => {});
  }, []);

  if (!data) {
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
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">A quick overview of partners and leads</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Partners</div>
          <div className="stat-card-value">{data.totalPartners}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Representatives</div>
          <div className="stat-card-value">{data.totalRepresentatives}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Leads</div>
          <div className="stat-card-value">{data.totalLeads}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Leads (Last 7 Days)</div>
          <div className="stat-card-value">{data.leadsLast7Days}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Leads (Last 30 Days)</div>
          <div className="stat-card-value">{data.leadsLast30Days}</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-title">Partners by Type</div>
          <hr className="card-divider" />
          {data.partnersByType.length === 0 ? (
            <div className="empty-state">No partners yet.</div>
          ) : (
            <div className="kv-list">
              {data.partnersByType.map((row) => (
                <div className="kv-row" key={row.type}>
                  <span className="kv-label">{row.type}</span>
                  <span className="kv-value">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Recent Leads</div>
          <hr className="card-divider" />
          {data.recentLeads.length === 0 ? (
            <div className="empty-state">No leads yet.</div>
          ) : (
            <div className="kv-list">
              {data.recentLeads.map((lead, i) => (
                <div className="kv-row" key={i}>
                  <span className="kv-label">
                    {lead.firstName} {lead.lastName}
                    <div style={{ fontSize: 12 }}>
                      <Link to={`/partners/${encodeURIComponent(lead.partnerId)}`}>{lead.partnerName}</Link>
                    </div>
                  </span>
                  <span className="kv-value">{new Date(lead.submittedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
