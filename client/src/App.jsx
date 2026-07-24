import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import PartnerListPage from "./pages/PartnerListPage.jsx";
import AddPartnerPage from "./pages/AddPartnerPage.jsx";
import PartnerDetailPage from "./pages/PartnerDetailPage.jsx";
import PublicLeadFormPage from "./pages/PublicLeadFormPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/form/:token" element={<PublicLeadFormPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/partners" replace />} />
        <Route path="/partners" element={<PartnerListPage />} />
        <Route path="/partners/new" element={<AddPartnerPage />} />
        <Route path="/partners/:partnerId" element={<PartnerDetailPage />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
        <Route path="/wpforms-inbox" element={<PlaceholderPage title="WPForms Inbox" />} />
        <Route path="/representatives" element={<PlaceholderPage title="Representatives" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/users-roles" element={<PlaceholderPage title="Users and Roles" />} />
        <Route path="/audit-log" element={<PlaceholderPage title="Audit Log" />} />
        <Route path="*" element={<Navigate to="/partners" replace />} />
      </Route>
    </Routes>
  );
}
