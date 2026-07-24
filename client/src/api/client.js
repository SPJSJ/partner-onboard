async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    const error = new Error(body?.error || "Request failed");
    error.status = res.status;
    error.errors = body?.errors;
    throw error;
  }
  return body;
}

export const api = {
  getMeta: () => request("/partners/meta"),
  listPartners: (search) => request(`/partners${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getPartner: (partnerId) => request(`/partners/${encodeURIComponent(partnerId)}`),
  createPartner: (payload) => request("/partners", { method: "POST", body: JSON.stringify(payload) }),
  validatePartner: (payload) => request("/partners/validate", { method: "POST", body: JSON.stringify(payload) }),
  getPublicForm: (token) => request(`/public/form/${encodeURIComponent(token)}`),
  submitPublicForm: (token, payload) =>
    request(`/public/form/${encodeURIComponent(token)}`, { method: "POST", body: JSON.stringify(payload) })
};
