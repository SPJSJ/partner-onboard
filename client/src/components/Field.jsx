function slugify(label) {
  return String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TextField({ label, required, error, className = "", id, ...props }) {
  const fieldId = id || `field-${slugify(label)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={fieldId}>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        id={fieldId}
        className={error ? "has-error" : ""}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={errorId}
        {...props}
      />
      {error && (
        <div className="field-error" id={errorId}>
          {error}
        </div>
      )}
    </div>
  );
}

export function SelectField({ label, required, error, children, className = "", id, ...props }) {
  const fieldId = id || `field-${slugify(label)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={fieldId}>
        {label} {required && <span className="required">*</span>}
      </label>
      <select
        id={fieldId}
        className={error ? "has-error" : ""}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={errorId}
        {...props}
      >
        {children}
      </select>
      {error && (
        <div className="field-error" id={errorId}>
          {error}
        </div>
      )}
    </div>
  );
}
