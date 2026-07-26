import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute() {
  const { loading, authenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
