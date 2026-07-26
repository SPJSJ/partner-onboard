import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import PartnerForm from "../components/PartnerForm.jsx";

export default function EditPartnerPage() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getPartner(partnerId)
      .then(setPartner)
      .catch((err) => setError(err.message || "Failed to load partner"));
  }, [partnerId]);

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate("/partners")}>
          Back to Partners
        </button>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="page">
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  const initialForm = {
    partnerId: partner.partnerId,
    partnerType: partner.partnerType,
    partnerName: partner.partnerName,
    contactFirstName: partner.contactFirstName,
    contactLastName: partner.contactLastName,
    contactEmail: partner.contactEmail,
    phoneNumber: partner.phoneNumber || "",
    street1: partner.street1,
    street2: partner.street2 || "",
    city: partner.city,
    state: partner.state,
    zipCode: partner.zipCode,
    countryCode: partner.countryCode
  };

  const initialRepresentatives = partner.representatives.map((r) => ({
    representativeId: r.representativeId,
    firstName: r.firstName,
    lastName: r.lastName,
    isPrimary: r.isPrimary,
    originalRepresentativeId: r.representativeId
  }));

  async function handleSubmit(payload) {
    await api.updatePartner(partnerId, payload);
    navigate(`/partners/${encodeURIComponent(payload.partnerId)}`, { state: { justUpdated: true } });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Partner</h1>
          <p className="page-subtitle">{partner.partnerName}</p>
        </div>
      </div>

      <PartnerForm
        key={partner.partnerId}
        mode="edit"
        originalPartnerId={partner.partnerId}
        initialForm={initialForm}
        initialRepresentatives={initialRepresentatives}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/partners/${encodeURIComponent(partnerId)}`)}
      />
    </div>
  );
}
