import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function ReportsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getReports().then(setData).catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Breakdowns and exports for Partners</p>
        </div>
        <div className="page-header-actions">
          <a className="btn btn-secondary" href={api.partnersExportUrl({})}>
            Export Partners CSV
          </a>
        </div>
      </div>

      {!data ? (
        <div className="empty-state">Loading...</div>
      ) : (
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
      )}
    </div>
  );
}
