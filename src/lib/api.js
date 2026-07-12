const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_BASE =
  import.meta.env.VITE_API_URL || "http://api-senyum-dental.vercel.app/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("sd_token");
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Permintaan gagal diproses.");
  }
  return payload;
}
