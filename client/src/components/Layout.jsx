import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

function getBreadcrumb(pathname) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/partners") return "Partners";
  if (pathname === "/partners/new") return "Partners / Add Partner";
  if (pathname.endsWith("/edit")) return "Partners / Edit Partner";
  if (pathname.startsWith("/partners/")) return "Partners / Partner Detail";
  if (pathname.startsWith("/representatives")) return "Representatives";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/users")) return "Users and Roles";
  if (pathname.startsWith("/audit-log")) return "Audit Log";
  return "";
}

function initials(email) {
  if (!email) return "?";
  return email.slice(0, 2).toUpperCase();
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, role, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">{getBreadcrumb(location.pathname)}</div>
          <div className="topbar-user">
            <div className="avatar">{initials(email)}</div>
            <div>
              <div className="topbar-user-name">{email}</div>
              <div className="topbar-user-role" style={{ textTransform: "capitalize" }}>
                {role}
              </div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ marginLeft: 12 }}>
              Log Out
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
