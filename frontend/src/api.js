import axios from "axios";

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000").replace(/^http:\/\//i, "https://");

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refresh_token: refresh });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post("/auth/register", data),
  login: (email, password) => api.post("/auth/login", new URLSearchParams({ username: email, password }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } }),
  me: ()            => api.get("/auth/me"),
};

// ── Products ────────────────────────────────────────────────
export const productsAPI = {
  list: (params)    => api.get("/products", { params }),
  get: (id)         => api.get(`/products/${id}`),
  categories: ()    => api.get("/products/categories"),
};

// ── Cart ────────────────────────────────────────────────────
export const cartAPI = {
  get: ()           => api.get("/cart"),
  update: (product_id, quantity) => api.post("/cart", { product_id, quantity }),
  clear: ()         => api.delete("/cart/clear"),
  validatePromo: (code, order_value) => api.post("/cart/validate-promo", { code, order_value }),
};

// ── Orders ──────────────────────────────────────────────────
export const ordersAPI = {
  place: (data)     => api.post("/orders/place", data),
  list: ()          => api.get("/orders"),
  get: (id)         => api.get(`/orders/${id}`),
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }),
};

// ── Reviews ─────────────────────────────────────────────────
export const reviewsAPI = {
  forProduct: (id)  => api.get(`/reviews/product/${id}`),
  create: (data)    => api.post("/reviews", data),
  delete: (id)      => api.delete(`/reviews/${id}`),
};

// ── Addresses ───────────────────────────────────────────────
export const addressesAPI = {
  list: ()          => api.get("/addresses"),
  create: (data)    => api.post("/addresses", data),
  update: (id, data)=> api.put(`/addresses/${id}`, data),
  delete: (id)      => api.delete(`/addresses/${id}`),
};

// ── Notifications ────────────────────────────────────────────
export const notifsAPI = {
  list: ()          => api.get("/notifications"),
  markRead: (id)    => api.post(`/notifications/${id}/read`),
  markAllRead: ()   => api.post("/notifications/read-all"),
};

// ── Loyalty ─────────────────────────────────────────────────
export const loyaltyAPI = {
  get: ()           => api.get("/loyalty"),
  transactions: ()  => api.get("/loyalty/transactions"),
  redeem: (points)  => api.post("/loyalty/redeem", { points }),
};

// ── Referrals ───────────────────────────────────────────────
export const referralsAPI = {
  get: ()           => api.get("/referrals"),
};

// ── Users ───────────────────────────────────────────────────
export const usersAPI = {
  update: (data)    => api.put("/users/me", data),
  changePassword: (data) => api.post("/users/me/change-password", data),
};

// ── Support Tickets ──────────────────────────────────────────
export const supportAPI = {
  create: (data)    => api.post("/support", data),
  list: ()          => api.get("/support"),
  get: (id)         => api.get(`/support/${id}`),
};

// ── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  stats: ()                    => api.get("/admin/stats"),
  users: ()                    => api.get("/admin/users"),
  toggleUser: (id)             => api.patch(`/admin/users/${id}/toggle-active`),
  promos: ()                   => api.get("/admin/promos"),
  createPromo: (data)          => api.post("/admin/promos", data),
  updatePromo: (id, data)      => api.patch(`/admin/promos/${id}`, data),
  deletePromo: (id)            => api.delete(`/admin/promos/${id}`),
  allTickets: ()               => api.get("/support/admin/all"),
  replyTicket: (id, data)      => api.patch(`/support/admin/${id}/reply`, data),
};

export default api;