const baseHeaders = {
  "Content-Type": "application/json"
};

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { ...baseHeaders };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:logout"));
      throw new Error("Session expired. Please sign in again.");
    }

    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

export function login({ email, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export function register({ email, password }) {
  return request("/api/auth/register", {
    method: "POST",
    body: { email, password }
  });
}

export function fetchStats(token) {
  return request("/api/flights/stats", { token });
}

export function fetchSearch({ query, type, token }) {
  const params = new URLSearchParams({ query, type });
  return request(`/api/flights/search?${params.toString()}`, { token });
}
