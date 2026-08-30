// Thin API client for the RaktaSetu backend.
// Vite proxies "/api" -> http://localhost:5000 in dev (see vite.config.js),
// so these paths work same-origin without any host/port hardcoding.

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response body — leave data as null.
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export function getBloodStock() {
  return request("/blood-stock");
}

export function createRequest({ bloodGroup, units, urgency }) {
  return request("/requests", {
    method: "POST",
    body: JSON.stringify({ bloodGroup, units, urgency }),
  });
}

export function getDonors(bloodGroup) {
  const q = bloodGroup ? `?bloodGroup=${encodeURIComponent(bloodGroup)}` : "";
  return request(`/donors${q}`);
}

export function reserve({ bankId, bloodGroup, units }) {
  return request("/reserve", {
    method: "POST",
    body: JSON.stringify({ bankId, bloodGroup, units }),
  });
}

export function acceptRequest(requestId) {
  return request("/accept", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
}

export function rejectRequest(requestId) {
  return request("/reject", {
    method: "POST",
    body: JSON.stringify({ requestId }),
  });
}
