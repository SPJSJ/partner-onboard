import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const workspaceLinks = [
  { to: "/dashboard", label: "Dashboard", icon: "D" },
  { to: "/partners", label: "Partners", icon: "P" },
  { to: "/representatives", label: "Representatives", icon: "R" },
  { to: "/leads", label: "Leads", icon: "L" },
  { to: "/reports", label: "Reports", icon: "T" }
];

const adminLinks = [
  { to: "/users", label: "Users and Roles", icon: "U" },
  { to: "/audit-log", label: "Audit Log", icon: "A" }
];

function NavItem({ to, label, icon }) {
  return (
    <NavLink to={to} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
      <span className="sidebar-link-icon">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">IS</div>
        <div className="sidebar-logo-text">Partner Admin</div>
      </div>

      <div className="sidebar-section-label">Workspace</div>
      {workspaceLinks.map((l) => (
        <NavItem key={l.to} {...l} />
      ))}

      {isAdmin && (
        <>
          <div className="sidebar-section-label">Administration</div>
          {adminLinks.map((l) => (
            <NavItem key={l.to} {...l} />
          ))}
        </>
      )}

      <div className="sidebar-spacer" />
      <div className="sidebar-footnote">Required fields marked with *</div>
    </aside>
  );
}
