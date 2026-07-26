async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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

function toQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const str = query.toString();
  return str ? `?${str}` : "";
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getSession: () => request("/auth/session"),

  getMeta: () => request("/partners/meta"),
  listPartners: (params) => request(`/partners${toQueryString(params)}`),
  getPartner: (partnerId) => request(`/partners/${encodeURIComponent(partnerId)}`),
  createPartner: (payload) => request("/partners", { method: "POST", body: JSON.stringify(payload) }),
  updatePartner: (partnerId, payload) =>
    request(`/partners/${encodeURIComponent(partnerId)}`, { method: "PUT", body: JSON.stringify(payload) }),
  validatePartner: (payload) => request("/partners/validate", { method: "POST", body: JSON.stringify(payload) }),
  partnersExportUrl: (params) => `/api/partners/export${toQueryString(params)}`,

  listLeads: (params) => request(`/leads${toQueryString(params)}`),
  leadsExportUrl: (params) => `/api/leads/export${toQueryString(params)}`,

  listRepresentatives: (params) => request(`/representatives${toQueryString(params)}`),

  getDashboard: () => request("/insights/dashboard"),
  getReports: () => request("/insights/reports"),

  listUsers: () => request("/users"),
  createUser: (payload) => request("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),

  listAuditLog: (params) => request(`/audit-log${toQueryString(params)}`),
  auditLogExportUrl: (params) => `/api/audit-log/export${toQueryString(params)}`,

  getPublicForm: (token) => request(`/public/form/${encodeURIComponent(token)}`),
  submitPublicForm: (token, payload) =>
    request(`/public/form/${encodeURIComponent(token)}`, { method: "POST", body: JSON.stringify(payload) })
};
