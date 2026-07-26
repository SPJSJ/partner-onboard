const STATUS_CLASSES = {
  Active: "badge-green",
  Pending: "badge-amber",
  Inactive: "badge-red"
};

export default function StatusBadge({ status }) {
  const cls = STATUS_CLASSES[status] || "badge-blue";
  return <span className={`badge ${cls}`}>{status}</span>;
}
