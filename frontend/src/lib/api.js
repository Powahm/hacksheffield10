// In dev, Vite proxies /api to Flask. In production, VITE_API_URL points at API Gateway.
const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["X-Admin-Token"] = token;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the TrendSwipe server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `The server answered ${res.status}.`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  products: () => request("/products"),
  product: (id) => request(`/products/${id}`),
  search: (q) => request(`/products/search?q=${encodeURIComponent(q)}`),
  next: (swipes) => request("/feed/next", { method: "POST", body: { swipes } }),
  chat: (body) => request("/chat", { method: "POST", body }),
  createProduct: (data, token) => request("/dashboard/products", { method: "POST", body: data, token }),
  updateProduct: (id, data, token) => request(`/dashboard/products/${id}`, { method: "PUT", body: data, token }),
  deleteProduct: (id, token) => request(`/dashboard/products/${id}`, { method: "DELETE", token }),
};
