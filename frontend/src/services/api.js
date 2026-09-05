const BASE_URL = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  contacts: {
    list: () => request("/contacts"),
    get: (id) => request(`/contacts/${id}`),
    create: (data) => request("/contacts", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id) => request(`/contacts/${id}`, { method: "DELETE" }),
  },
  deals: {
    list: () => request("/deals"),
    priority: () => request("/deals/priority"),
    get: (id) => request(`/deals/${id}`),
    create: (data) => request("/deals", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/deals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    updateStage: (id, stageId) =>
      request(`/deals/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stageId }) }),
    remove: (id) => request(`/deals/${id}`, { method: "DELETE" }),
  },
  activities: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/activities${qs ? `?${qs}` : ""}`);
    },
    create: (data) => request("/activities", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => request(`/activities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id) => request(`/activities/${id}`, { method: "DELETE" }),
  },
  stages: {
    list: () => request("/stages"),
  },
  forecast: {
    get: () => request("/forecast"),
    history: () => request("/forecast/history"),
  },
  alerts: {
    list: () => request("/alerts"),
  },
  users: {
    list: () => request("/users"),
  },
};
