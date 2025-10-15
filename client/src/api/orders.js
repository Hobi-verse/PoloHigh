import { apiRequest } from "./client";

export const fetchOrderById = async (orderId, { signal } = {}) => {
  if (!orderId) {
    throw new Error("fetchOrderById requires an orderId");
  }

  const response = await apiRequest(`/orders/${orderId}`, { signal });
  return response?.data ?? response ?? {};
};
