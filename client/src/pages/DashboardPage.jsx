import { useEffect, useState } from "react";
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
          <p className="page-subtitle">A quick overview of partners and representatives</p>
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
      </div>

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
    </div>
  );
}
