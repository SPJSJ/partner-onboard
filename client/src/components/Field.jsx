export function TextField({ label, required, error, className = "", ...props }) {
  return (
    <div className={`field ${className}`}>
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <input className={error ? "has-error" : ""} {...props} />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export function SelectField({ label, required, error, children, className = "", ...props }) {
  return (
    <div className={`field ${className}`}>
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <select className={error ? "has-error" : ""} {...props}>
        {children}
      </select>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
