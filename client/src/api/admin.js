import { apiRequest } from "./client";

const toISOStringSafe = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const normalizeOrderStatus = (status) =>
  typeof status === "string" && status.trim().length
    ? status.trim().toLowerCase()
    : "unknown";

const normalizeAdminOrder = (order) => {
  if (!order || typeof order !== "object") {
    return null;
  }

  return {
    id: order.id ?? order.orderNumber ?? order._id ?? null,
    orderNumber: order.orderNumber ?? order.id ?? "",
    status: normalizeOrderStatus(order.status),
    placedAt: toISOStringSafe(order.placedAt),
    grandTotal:
      typeof order.grandTotal === "number"
        ? order.grandTotal
        : typeof order.pricing?.grandTotal === "number"
          ? order.pricing.grandTotal
          : null,
    discount:
      typeof order.discount === "number"
        ? order.discount
        : typeof order.pricing?.discount === "number"
          ? order.pricing.discount
          : null,
    paymentStatus: order.paymentStatus ?? order.payment?.status ?? null,
    paymentMethod: order.paymentMethod ?? order.payment?.method ?? null,
    itemsCount:
      typeof order.itemsCount === "number"
        ? order.itemsCount
        : Array.isArray(order.items)
          ? order.items.length
          : null,
    customerName:
      order.customer?.name ??
      order.customerName ??
      (typeof order.customer === "string" ? order.customer : null),
    customerEmail: order.customer?.email ?? null,
    customerPhone: order.customer?.phone ?? null,
  };
};

const normalizeAdminCustomer = (customer) => {
  if (!customer || typeof customer !== "object") {
    return null;
  }

  return {
    id: customer.id ?? customer._id ?? null,
    userId: customer.userId ?? null,
    name: customer.name ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? null,
    membershipTier: customer.membershipTier ?? null,
    totalOrders:
      typeof customer.totalOrders === "number" ? customer.totalOrders : 0,
    totalSpent:
      typeof customer.totalSpent === "number" ? customer.totalSpent : 0,
    rewardPoints:
      typeof customer.rewardPoints === "number" ? customer.rewardPoints : 0,
    walletBalance:
      typeof customer.walletBalance === "number"
        ? customer.walletBalance
        : 0,
    lastUpdated: toISOStringSafe(customer.lastUpdated),
    joinedAt: toISOStringSafe(customer.joinedAt ?? customer.userCreatedAt),
    isVerified: Boolean(customer.isVerified),
  };
};

export const fetchDashboardMetrics = async () => {
  const response = await apiRequest("/admin/dashboard/metrics");
  return response?.data ?? response ?? {};
};

export const fetchRecentOrders = async (params = {}) => {
  const query = {
    limit: 10,
    sortBy: "placedAt",
    sortOrder: "desc",
    ...params,
  };

  const response = await apiRequest("/search/admin/orders", { query });
  const data = response?.data ?? {};
  const pagination = response?.pagination ?? null;

  const results = Array.isArray(data.results)
    ? data.results.map((order) => normalizeAdminOrder(order)).filter(Boolean)
    : [];

  return {
    results,
    pagination,
    stats: Array.isArray(data.stats) ? data.stats : [],
    query: data.query ?? "",
    source: "api",
  };
};

export const fetchRecentActivities = async () => {
  const response = await apiRequest("/admin/activities");
  return response?.data ?? response ?? [];
};

export const fetchProductsSummary = async (params = {}) => {
  const query = {
    includeInactive: true,
    ...params,
  };

  const payload = await apiRequest("/products", { query });
  return Array.isArray(payload?.products) ? payload.products : [];
};

export const createProduct = async (productData) => {
  const response = await apiRequest("/products", {
    method: "POST",
    body: productData,
  });

  return response?.product ?? null;
};

export const updateProduct = async (productId, productData) => {
  if (!productId) {
    throw new Error("updateProduct requires a productId");
  }

  const response = await apiRequest(`/products/${productId}`, {
    method: "PUT",
    body: productData,
  });

  return response?.product ?? null;
};

export const deleteProduct = async (productId) => {
  if (!productId) {
    throw new Error("deleteProduct requires a productId");
  }

  return apiRequest(`/products/${productId}`, {
    method: "DELETE",
  });
};

export const updateProductStock = async (productId, payload) => {
  if (!productId) {
    throw new Error("updateProductStock requires a productId");
  }

  return apiRequest(`/products/${productId}/stock`, {
    method: "PATCH",
    body: payload,
  });
};

export const fetchCustomers = async (params = {}) => {
  const query = {
    limit: 20,
    sortBy: "recentActivity",
    sortOrder: "desc",
    ...params,
  };

  const response = await apiRequest("/search/admin/customers", { query });
  const data = response?.data ?? {};
  const pagination = response?.pagination ?? null;

  const results = Array.isArray(data.results)
    ? data.results
      .map((customer) => normalizeAdminCustomer(customer))
      .filter(Boolean)
    : [];

  return {
    results,
    pagination,
    tierDistribution: Array.isArray(data.tierDistribution)
      ? data.tierDistribution
      : [],
    query: data.query ?? "",
    source: "api",
  };
};

export const fetchReports = async () => {
  const response = await apiRequest("/admin/reports");
  return response?.data ?? response ?? [];
};

export const fetchAdminUsers = async ({ signal } = {}) => {
  const response = await apiRequest("/admin/users", { signal });
  return response?.data ?? response ?? [];
};
