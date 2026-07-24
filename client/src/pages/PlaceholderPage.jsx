export default function PlaceholderPage({ title }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">This section isn't part of this release.</p>
        </div>
      </div>
      <div className="table-wrap">
        <div className="empty-state">Coming soon.</div>
      </div>
    </div>
  );
}
