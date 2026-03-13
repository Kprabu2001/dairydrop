import axios from "axios";

const API_URL = "https://dairydrop-3eoc.onrender.com";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// ── Request: attach access token ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: auto-refresh on 401, then retry original request ─
let _refreshing = null; // shared promise so concurrent 401s don't fire N refreshes

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only intercept 401s that haven't already been retried
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      // No refresh token at all — log out immediately
      _forceLogout();
      return Promise.reject(error);
    }

    try {
      // If another request is already refreshing, wait for that instead of making a second call
      if (!_refreshing) {
        _refreshing = axios
          .post(`${API_URL}/api/auth/refresh`, { refresh_token: refreshToken })
          .finally(() => { _refreshing = null; });
      }

      const { data } = await _refreshing;
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      // Retry original request with the new token
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return api(original);
    } catch {
      // Refresh token itself is expired or invalid — force logout
      _forceLogout();
      return Promise.reject(error);
    }
  }
);

/**
 * Dispatch a custom DOM event so the React app can react (clear state,
 * show login screen) without api.js needing a direct reference to React state.
 * In App.js listen with: window.addEventListener("auth:logout", () => { ... })
 */
function _forceLogout() {
  localStorage.clear();
  window.dispatchEvent(new Event("auth:logout"));
}

// ── Auth ────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post("/auth/register", data),
  login: (email, password) => api.post(
    "/auth/login",
    new URLSearchParams({ username: email, password }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  ),
  me: () => api.get("/auth/me"),
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
  list: ()           => api.get("/addresses"),
  create: (data)     => api.post("/addresses", data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id)       => api.delete(`/addresses/${id}`),
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
  get: () => api.get("/referrals"),
};

// ── Users ───────────────────────────────────────────────────
export const usersAPI = {
  update: (data)         => api.put("/users/me", data),
  changePassword: (data) => api.post("/users/me/change-password", data),
};

// ── Wishlist ─────────────────────────────────────────────────
export const wishlistAPI = {
  get: ()      => api.get("/wishlist"),
  toggle: (id) => api.post(`/wishlist/${id}`),
  remove: (id) => api.delete(`/wishlist/${id}`),
};

// ── Support Tickets ──────────────────────────────────────────
export const supportAPI = {
  create: (data) => api.post("/support", data),
  list: ()       => api.get("/support"),
  get: (id)      => api.get(`/support/${id}`),
};

// ── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  stats: ()                => api.get("/admin/stats"),
  users: ()                => api.get("/admin/users"),
  toggleUser: (id)         => api.patch(`/admin/users/${id}/toggle-active`),
  promos: ()               => api.get("/admin/promos"),
  createPromo: (data)      => api.post("/admin/promos", data),
  updatePromo: (id, data)  => api.patch(`/admin/promos/${id}`, data),
  deletePromo: (id)        => api.delete(`/admin/promos/${id}`),
  allTickets: ()           => api.get("/support/admin/all"),
  replyTicket: (id, data)  => api.patch(`/support/admin/${id}/reply`, data),
};

export default api;