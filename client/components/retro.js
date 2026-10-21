// Reusable retro (Windows 95 style) building blocks. Styles live in app/globals.css.

export function Window({ title, icon, children, toolbar, className = "" }) {
  return (
    <section className={`win ${className}`}>
      <header className="win-title">
        <span>
          {icon ? `${icon} ` : ""}
          {title}
        </span>
        <span className="win-ctrls" aria-hidden="true">
          <i>_</i>
          <i>□</i>
          <i>x</i>
        </span>
      </header>
      {toolbar && <div className="win-toolbar">{toolbar}</div>}
      <div className="win-body">{children}</div>
    </section>
  );
}

export function Button({ variant = "", size = "", type = "button", className = "", ...props }) {
  return <button type={type} className={`btn ${variant} ${size} ${className}`} {...props} />;
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

export function Badge({ tone = "", children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Stat({ label, value, tone = "" }) {
  return (
    <div className={`stat raised ${tone}`}>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

export function Loading({ label = "Loading..." }) {
  return (
    <div className="loading" role="status">
      {label}
      <br />
      <span className="progress" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </div>
  );
}

export function Empty({ text = "Nothing here yet.", icon = "📂" }) {
  return (
    <div className="empty">
      <span className="icon">{icon}</span>
      {text}
    </div>
  );
}

export function Message({ kind = "error", children, onClose }) {
  return (
    <div className={`msg ${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span className="icon">{kind === "error" ? "⚠️" : "✅"}</span>
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <Button size="small" onClick={onClose}>
          OK
        </Button>
      )}
    </div>
  );
}

// columns: [{ key, label, render?(row), align?: "num" }]
export function DataTable({ columns, rows, rowKey = (r) => r._id, actions }) {
  return (
    <div className="sunken scroll">
      <table className="grid">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === "num" ? "num" : ""}>
                {c.label}
              </th>
            ))}
            {actions && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key} className={c.align === "num" ? "num" : ""}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
              {actions && <td className="actions">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
