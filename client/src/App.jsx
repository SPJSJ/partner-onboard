import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import RequireRole from "./auth/RequireRole.jsx";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PartnerListPage from "./pages/PartnerListPage.jsx";
import AddPartnerPage from "./pages/AddPartnerPage.jsx";
import EditPartnerPage from "./pages/EditPartnerPage.jsx";
import PartnerDetailPage from "./pages/PartnerDetailPage.jsx";
import RepresentativesPage from "./pages/RepresentativesPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import AuditLogPage from "./pages/AuditLogPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/partners" element={<PartnerListPage />} />
            <Route path="/partners/:partnerId" element={<PartnerDetailPage />} />
            <Route path="/representatives" element={<RepresentativesPage />} />
            <Route path="/reports" element={<ReportsPage />} />

            <Route element={<RequireRole role="admin" />}>
              <Route path="/partners/new" element={<AddPartnerPage />} />
              <Route path="/partners/:partnerId/edit" element={<EditPartnerPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/audit-log" element={<AuditLogPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
