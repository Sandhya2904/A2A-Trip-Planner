const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || body.detail || "Request failed.");
  }

  return body;
}

export async function requestOtp({ identifier, name }) {
  return request("/api/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      name,
    }),
  });
}

export async function verifyOtp({ identifier, otp, name }) {
  return request("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      otp,
      name,
    }),
  });
}

export async function getCurrentUser(token) {
  return request("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function logoutUser(token) {
  return request("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({
      token,
    }),
  });
}