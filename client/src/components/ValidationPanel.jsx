function Dot({ status }) {
  if (status === true) return <span className="validation-dot ok">✓</span>;
  if (status === false) return <span className="validation-dot bad">×</span>;
  return <span className="validation-dot pending">–</span>;
}

const LABELS = {
  partnerIdAvailable: "Partner ID is available",
  representativeIdAvailable: "Representative ID is available",
  emailValid: "Contact email is valid",
  phoneValid: "Phone number is valid",
  zipValid: "ZIP code is valid",
  duplicateFound: "No exact duplicate found"
};

export default function ValidationPanel({ validation }) {
  return (
    <div className="card">
      <div className="card-title">Source and validation</div>
      <div className="source-meta">Live checks run as you fill in the form</div>
      <hr className="card-divider" />
      <div className="validation-list">
        {Object.entries(LABELS).map(([key, label]) => {
          const raw = validation[key];
          const status = key === "duplicateFound" ? (raw === null ? null : !raw) : raw;
          return (
            <div className="validation-item" key={key}>
              <Dot status={status} />
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
