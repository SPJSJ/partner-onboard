import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PartnerListPage from "./pages/PartnerListPage.jsx";
import AddPartnerPage from "./pages/AddPartnerPage.jsx";
import EditPartnerPage from "./pages/EditPartnerPage.jsx";
import PartnerDetailPage from "./pages/PartnerDetailPage.jsx";
import LeadsPage from "./pages/LeadsPage.jsx";
import PublicLeadFormPage from "./pages/PublicLeadFormPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/form/:token" element={<PublicLeadFormPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/partners" replace />} />
            <Route path="/partners" element={<PartnerListPage />} />
            <Route path="/partners/new" element={<AddPartnerPage />} />
            <Route path="/partners/:partnerId" element={<PartnerDetailPage />} />
            <Route path="/partners/:partnerId/edit" element={<EditPartnerPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="*" element={<Navigate to="/partners" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
