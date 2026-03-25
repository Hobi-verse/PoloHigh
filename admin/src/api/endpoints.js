import { apiRequest } from "./client";
import { API_BASE_URL } from "./config";

export const authApi = {
  sendOtp: (payload) => apiRequest("/v1/auth/send-otp", { method: "POST", body: payload }),
  verifyOtp: (payload) => apiRequest("/v1/auth/verify-otp", { method: "POST", body: payload }),
  signup: (payload) => apiRequest("/v1/auth/signup", { method: "POST", body: payload }),
  login: (payload) => apiRequest("/v1/auth/login", { method: "POST", body: payload }),
  logout: () => apiRequest("/v1/auth/logout", { method: "POST" }),
  getProfile: () => apiRequest("/v1/auth/profile"),
  linkMobile: (payload) => apiRequest("/v1/auth/link-mobile", { method: "POST", body: payload }),
  getGoogleAuthUrl: () => `${API_BASE_URL}/v1/auth/google`,
};

export const productApi = {
  list: (query) => apiRequest("/products", { query }),
  getById: (id) => apiRequest(`/products/${id}`),
  getVariants: (id) => apiRequest(`/products/${id}/variants`),
  checkAvailability: (id) => apiRequest(`/products/${id}/availability`),
  create: (payload) => apiRequest("/products", { method: "POST", body: payload }),
  update: (id, payload) => apiRequest(`/products/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),
  updateStock: (id, payload) =>
    apiRequest(`/products/${id}/stock`, { method: "PATCH", body: payload }),
};

export const categoryApi = {
  list: () => apiRequest("/categories"),
  getTree: () => apiRequest("/categories/tree"),
  getBySlug: (slug) => apiRequest(`/categories/${slug}`),
  getFilters: (slug) => apiRequest(`/categories/${slug}/filters`),
  getProducts: (slug, query) => apiRequest(`/categories/${slug}/products`, { query }),
  create: (payload) => apiRequest("/categories", { method: "POST", body: payload }),
  update: (slug, payload) =>
    apiRequest(`/categories/${slug}`, { method: "PUT", body: payload }),
  remove: (slug) => apiRequest(`/categories/${slug}`, { method: "DELETE" }),
  updateProductCount: (slug, payload) =>
    apiRequest(`/categories/${slug}/product-count`, { method: "PATCH", body: payload }),
};

export const cartApi = {
  get: () => apiRequest("/cart"),
  getSummary: () => apiRequest("/cart/summary"),
  validate: () => apiRequest("/cart/validate", { method: "POST" }),
  addItem: (payload) => apiRequest("/cart/items", { method: "POST", body: payload }),
  updateItem: (itemId, payload) =>
    apiRequest(`/cart/items/${itemId}`, { method: "PATCH", body: payload }),
  removeItem: (itemId) => apiRequest(`/cart/items/${itemId}`, { method: "DELETE" }),
  saveForLater: (itemId) => apiRequest(`/cart/items/${itemId}/save-for-later`, { method: "PATCH" }),
  moveToCart: (itemId) => apiRequest(`/cart/items/${itemId}/move-to-cart`, { method: "PATCH" }),
  clear: () => apiRequest("/cart", { method: "DELETE" }),
};

export const wishlistApi = {
  get: () => apiRequest("/wishlist"),
  getSummary: () => apiRequest("/wishlist/summary"),
  sync: () => apiRequest("/wishlist/sync", { method: "POST" }),
  checkProduct: (productId) => apiRequest(`/wishlist/check/${productId}`),
  addItem: (payload) => apiRequest("/wishlist", { method: "POST", body: payload }),
  updateItem: (itemId, payload) =>
    apiRequest(`/wishlist/${itemId}`, { method: "PATCH", body: payload }),
  removeItem: (itemId) => apiRequest(`/wishlist/${itemId}`, { method: "DELETE" }),
  moveToCart: (itemId, payload) =>
    apiRequest(`/wishlist/${itemId}/move-to-cart`, { method: "POST", body: payload }),
  clear: () => apiRequest("/wishlist", { method: "DELETE" }),
};

export const addressApi = {
  list: () => apiRequest("/addresses"),
  getDefault: () => apiRequest("/addresses/default"),
  getById: (id) => apiRequest(`/addresses/${id}`),
  create: (payload) => apiRequest("/addresses", { method: "POST", body: payload }),
  update: (id, payload) => apiRequest(`/addresses/${id}`, { method: "PUT", body: payload }),
  setDefault: (id) => apiRequest(`/addresses/${id}/set-default`, { method: "PATCH" }),
  remove: (id) => apiRequest(`/addresses/${id}`, { method: "DELETE" }),
  validatePincode: (payload) =>
    apiRequest("/addresses/validate-pincode", { method: "POST", body: payload }),
};

export const orderApi = {
  getStats: () => apiRequest("/orders/stats"),
  list: (query) => apiRequest("/orders", { query }),
  create: (payload) => apiRequest("/orders", { method: "POST", body: payload }),
  getById: (id) => apiRequest(`/orders/${id}`),
  cancel: (id, payload) => apiRequest(`/orders/${id}/cancel`, { method: "PATCH", body: payload }),
  listAllAdmin: (query) => apiRequest("/orders/admin/all", { query }),
  updateStatus: (id, payload) =>
    apiRequest(`/orders/${id}/status`, { method: "PATCH", body: payload }),
  confirmPayment: (id, payload) =>
    apiRequest(`/orders/${id}/confirm-payment`, { method: "PATCH", body: payload }),
};

export const profileApi = {
  get: () => apiRequest("/profile"),
  update: (payload) => apiRequest("/profile", { method: "PUT", body: payload }),
  getSummary: () => apiRequest("/profile/summary"),
  updatePreferences: (payload) =>
    apiRequest("/profile/preferences", { method: "PATCH", body: payload }),
  getMembership: () => apiRequest("/profile/membership"),
  getRewards: () => apiRequest("/profile/rewards"),
  redeemPoints: (payload) =>
    apiRequest("/profile/rewards/redeem", { method: "POST", body: payload }),
  getReferral: () => apiRequest("/profile/referral"),
  applyReferral: (payload) =>
    apiRequest("/profile/referral/apply", { method: "POST", body: payload }),
  getSecurity: () => apiRequest("/profile/security"),
  toggle2FA: (payload) => apiRequest("/profile/security/2fa", { method: "PATCH", body: payload }),
  addTrustedDevice: (payload) =>
    apiRequest("/profile/security/device", { method: "POST", body: payload }),
  removeTrustedDevice: (deviceId) =>
    apiRequest(`/profile/security/device/${deviceId}`, { method: "DELETE" }),
};

export const reviewApi = {
  listProductReviews: (productId, query) => apiRequest(`/reviews/product/${productId}`, { query }),
  create: (payload) => apiRequest("/reviews", { method: "POST", body: payload }),
  listUserReviews: (query) => apiRequest("/reviews/user", { query }),
  canReview: (productId) => apiRequest(`/reviews/can-review/${productId}`),
  update: (id, payload) => apiRequest(`/reviews/${id}`, { method: "PUT", body: payload }),
  remove: (id) => apiRequest(`/reviews/${id}`, { method: "DELETE" }),
  markHelpful: (id) => apiRequest(`/reviews/${id}/helpful`, { method: "PATCH" }),
  unmarkHelpful: (id) => apiRequest(`/reviews/${id}/helpful`, { method: "DELETE" }),
  listAllAdmin: (query) => apiRequest("/reviews/admin/all", { query }),
  approve: (id) => apiRequest(`/reviews/${id}/approve`, { method: "PATCH" }),
  reject: (id, payload) => apiRequest(`/reviews/${id}/reject`, { method: "PATCH", body: payload }),
  respond: (id, payload) => apiRequest(`/reviews/${id}/respond`, { method: "PATCH", body: payload }),
};

export const couponApi = {
  validate: (payload) => apiRequest("/coupons/validate", { method: "POST", body: payload }),
  listAvailable: () => apiRequest("/coupons/available"),
  getUserUsage: () => apiRequest("/coupons/my-usage"),
  autoApply: (payload) => apiRequest("/coupons/auto-apply", { method: "POST", body: payload }),
  create: (payload) => apiRequest("/coupons/admin/create", { method: "POST", body: payload }),
  listAllAdmin: (query) => apiRequest("/coupons/admin/all", { query }),
  getAnalytics: () => apiRequest("/coupons/admin/analytics"),
  getByIdAdmin: (id) => apiRequest(`/coupons/admin/${id}`),
  updateAdmin: (id, payload) => apiRequest(`/coupons/admin/${id}`, { method: "PUT", body: payload }),
  removeAdmin: (id) => apiRequest(`/coupons/admin/${id}`, { method: "DELETE" }),
  toggleStatus: (id) => apiRequest(`/coupons/admin/${id}/toggle-status`, { method: "PATCH" }),
};

export const searchApi = {
  searchProducts: (query) => apiRequest("/search/products", { query }),
  getSuggestions: (query) => apiRequest("/search/suggestions", { query }),
  searchOrdersAdmin: (query) => apiRequest("/search/admin/orders", { query }),
  searchCustomersAdmin: (query) => apiRequest("/search/admin/customers", { query }),
};

export const paymentApi = {
  createOrder: (payload) => apiRequest("/payments/create-order", { method: "POST", body: payload }),
  verifyPayment: (payload) =>
    apiRequest("/payments/verify-payment", { method: "POST", body: payload }),
  getStatus: (paymentId) => apiRequest(`/payments/status/${paymentId}`),
  handleFailure: (payload) => apiRequest("/payments/failure", { method: "POST", body: payload }),
  refund: (payload) => apiRequest("/payments/refund", { method: "POST", body: payload }),
  webhook: (payload) => apiRequest("/payments/webhook", { method: "POST", body: payload }),
};

export const adminApi = {
  getOverview: () => apiRequest("/admin/overview"),
  listPayments: (query) => apiRequest("/admin/payments", { query }),
};

export const api = {
  auth: authApi,
  products: productApi,
  categories: categoryApi,
  cart: cartApi,
  wishlist: wishlistApi,
  addresses: addressApi,
  orders: orderApi,
  profile: profileApi,
  reviews: reviewApi,
  coupons: couponApi,
  search: searchApi,
  payments: paymentApi,
  admin: adminApi,
};

export default api;
