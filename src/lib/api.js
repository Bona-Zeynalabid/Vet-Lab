const BASE_URL = "/api";

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function buildQueryString(params) {
  const filtered = Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== null && v !== "");
  if (filtered.length === 0) return "";
  return "?" + new URLSearchParams(filtered).toString();
}

export const casesApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/case${qs}`);
    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/case/${id}`);
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${BASE_URL}/case`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/case/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/case/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },
};

export const bacteriologyApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/bacteriology${qs}`);
    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/bacteriology/${id}`);
    return handleResponse(res);
  },

  getByDoc: async (doc) => {
    const res = await fetch(`${BASE_URL}/bacteriology?doc=${encodeURIComponent(doc)}`);
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${BASE_URL}/bacteriology`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/bacteriology/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/bacteriology/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },
};

export const parasitologyApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/parasitology${qs}`);
    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/parasitology/${id}`);
    return handleResponse(res);
  },

  getByDoc: async (doc) => {
    const res = await fetch(`${BASE_URL}/parasitology?doc=${encodeURIComponent(doc)}`);
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${BASE_URL}/parasitology`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/parasitology/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/parasitology/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },
};

export const pathologyApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/pathology${qs}`);
    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/pathology/${id}`);
    return handleResponse(res);
  },

  getByDoc: async (doc) => {
    const res = await fetch(`${BASE_URL}/pathology?doc=${encodeURIComponent(doc)}`);
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${BASE_URL}/pathology`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/pathology/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/pathology/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },
};

export const diagnosisApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/diagnosis${qs}`);
    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/diagnosis/${id}`);
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${BASE_URL}/diagnosis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/diagnosis/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/diagnosis/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },
};

export const pharmacyApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/pharmacy${qs}`);
    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/pharmacy/${id}`);
    return handleResponse(res);
  },

  getByPrescriptionNumber: async (prescriptionNumber) => {
    const res = await fetch(`${BASE_URL}/pharmacy?prescriptionNumber=${encodeURIComponent(prescriptionNumber)}`);
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${BASE_URL}/pharmacy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/pharmacy/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/pharmacy/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },
};
// Add after the other API objects
export const labRequestApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/labrequest${qs}`);
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/labrequest/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${BASE_URL}/labrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/labrequest/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/labrequest/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
};
// Bacteriology Lab Requests
export const bactreqApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/bactreq${qs}`);
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/bactreq/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${BASE_URL}/bactreq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/bactreq/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/bactreq/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
};

// PARASITOLOGY REQUESTS
export const parareqApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/parareq${qs}`);
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/parareq/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${BASE_URL}/parareq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/parareq/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/parareq/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
};

// PATHOLOGY REQUESTS
export const pathoreqApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/pathoreq${qs}`);
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/pathoreq/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${BASE_URL}/pathoreq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/pathoreq/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/pathoreq/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
};
// Add these functions to lib/api.js

export const credentialApi = {
  list: async (params = {}) => {
    const qs = buildQueryString(params);
    const res = await fetch(`${BASE_URL}/credential${qs}`);
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${BASE_URL}/credential/${id}`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${BASE_URL}/credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/credential/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/credential/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
  verify: async (role, pin) => {
    const res = await fetch(`${BASE_URL}/credential/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, pin }),
    });
    return handleResponse(res);
  },
  seed: async () => {
    const res = await fetch(`${BASE_URL}/credential/seed`);
    return handleResponse(res);
  },
};