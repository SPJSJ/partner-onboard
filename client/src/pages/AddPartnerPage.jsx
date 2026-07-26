import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import PartnerForm, { emptyRep } from "../components/PartnerForm.jsx";

const emptyForm = {
  partnerId: "",
  partnerType: "",
  partnerName: "",
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  phoneNumber: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
  countryCode: "US"
};

export default function AddPartnerPage() {
  const navigate = useNavigate();

  async function handleSubmit(payload) {
    const created = await api.createPartner(payload);
    navigate(`/partners/${encodeURIComponent(created.partnerId)}`, { state: { justCreated: true } });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Partner</h1>
          <p className="page-subtitle">Create a Partner and its first Representative</p>
        </div>
      </div>

      <PartnerForm
        mode="add"
        initialForm={emptyForm}
        initialRepresentatives={[{ ...emptyRep(), isPrimary: true }]}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/partners")}
      />
    </div>
  );
}
