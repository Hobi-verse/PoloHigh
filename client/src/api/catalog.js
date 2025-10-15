import { apiRequest } from "./client";

const normalizeProductsResponse = (payload) => {
  const products = Array.isArray(payload?.products) ? payload.products : [];

  return {
    ...payload,
    items: products,
  };
};

export const fetchProducts = async (filters = {}, { signal } = {}) => {
  const payload = await apiRequest("/products", {
    method: "GET",
    query: filters,
    signal,
  });

  return normalizeProductsResponse(payload);
};

export const fetchProductById = async (productId, { signal } = {}) => {
  if (!productId) {
    throw new Error("fetchProductById requires a productId");
  }

  const payload = await apiRequest(`/products/${productId}`, { signal });
  return payload?.product ?? null;
};
