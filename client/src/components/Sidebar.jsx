import { NavLink } from "react-router-dom";

const links = [
  { to: "/partners", label: "Partners", icon: "P" },
  { to: "/leads", label: "Leads", icon: "L" }
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
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">IS</div>
        <div className="sidebar-logo-text">Partner Admin</div>
      </div>

      <div className="sidebar-section-label">Workspace</div>
      {links.map((l) => (
        <NavItem key={l.to} {...l} />
      ))}

      <div className="sidebar-spacer" />
      <div className="sidebar-footnote">Required fields marked with *</div>
    </aside>
  );
}
