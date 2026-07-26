import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function RequireRole({ role }) {
  const { loading, role: currentRole } = useAuth();

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  if (currentRole !== role) {
    return (
      <div className="page">
        <div className="alert alert-error">You don't have permission to view this page.</div>
      </div>
    );
  }

  return <Outlet />;
}
