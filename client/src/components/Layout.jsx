import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

function getBreadcrumb(pathname) {
  if (pathname === "/partners") return "Partners";
  if (pathname === "/partners/new") return "Partners / Add Partner";
  if (pathname.startsWith("/partners/")) return "Partners / Partner Detail";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/wpforms-inbox")) return "WPForms Inbox";
  if (pathname.startsWith("/representatives")) return "Representatives";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/users-roles")) return "Users and Roles";
  if (pathname.startsWith("/audit-log")) return "Audit Log";
  return "";
}

export default function Layout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">{getBreadcrumb(location.pathname)}</div>
          <div className="topbar-user">
            <div className="avatar">SJ</div>
            <div>
              <div className="topbar-user-name">Sam Joseph</div>
              <div className="topbar-user-role">Administrator</div>
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
