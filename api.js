// api.js — shared fetch helper + auth token storage for all pages.
// No build step, no framework: plain JS, loaded as a <script> on every page.

const API_BASE = window.API_BASE || "https://invoice-server-c0n2.onrender.com/v1";

const Auth = {
  getAccessToken() { return localStorage.getItem("access_token"); },
  getRefreshToken() { return localStorage.getItem("refresh_token"); },
  setTokens(access, refresh) {
    localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
  },
  setUser(user) { localStorage.setItem("user", JSON.stringify(user)); },
  getUser() {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },
  clear() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },
  requireLogin() {
    if (!this.getAccessToken()) {
      window.location.href = "login.html";
    }
  },
};

/**
 * Calls the API. Automatically attaches the bearer token and retries once
 * with a refreshed access token if the first call comes back 401.
 */
async function apiFetch(path, { method = "GET", body, skipAuth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (!skipAuth) {
    const token = Auth.getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${Auth.getAccessToken()}`;
      res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    } else {
      Auth.clear();
      window.location.href = "login.html";
      return null;
    }
  }

  let data = null;
  try { data = await res.json(); } catch (_) { /* empty body, e.g. 204 */ }

  if (!res.ok) {
    const message = extractErrorMessage(data) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }
  return data;
}

/**
 * Downloads a binary response (like a PDF) and saves it via the browser.
 * Separate from apiFetch because that always parses JSON — this expects
 * a file on success but still needs to surface a JSON error message if
 * the server rejects the request (e.g. quota exceeded).
 */
async function apiDownload(path, filename) {
  const headers = {};
  const token = Auth.getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, { headers });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${Auth.getAccessToken()}`;
      res = await fetch(`${API_BASE}${path}`, { headers });
    }
  }

  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch (_) {}
    throw new ApiError(extractErrorMessage(data) || `Download failed (${res.status})`, res.status, data);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

async function tryRefresh() {
  const refreshToken = Auth.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    if (!res.ok) return false;
    const data = await res.json();
    Auth.setTokens(data.access, null);
    return true;
  } catch (_) {
    return false;
  }
}

function extractErrorMessage(data) {
  if (!data) return null;
  if (typeof data.error === "string") return data.error;
  // marshmallow validation errors come back as { field: ["msg"] }
  if (typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey])) {
      return `${firstKey}: ${data[firstKey][0]}`;
    }
  }
  return null;
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch (_) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function showError(container, message) {
  container.innerHTML = `<div class="error-banner">${escapeHtml(message)}</div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
