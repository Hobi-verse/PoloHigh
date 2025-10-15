import { apiRequest } from "./client";

const DEFAULT_TOTALS = Object.freeze({
  subtotal: 0,
  itemCount: 0,
  savedItemCount: 0,
});

const createEmptyCart = () => ({
  id: null,
  items: [],
  totals: { ...DEFAULT_TOTALS },
  lastActivityAt: null,
});

const normalizeCartItem = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const rawProduct = item.productId;
  const productId =
    typeof rawProduct === "string"
      ? rawProduct
      : rawProduct?.slug ?? rawProduct?._id ?? rawProduct?.id ?? null;

  return {
    id: item.id ?? item._id ?? productId ?? item.variantSku,
    productId,
    title: item.title ?? "",
    price: Number.isFinite(item.price) ? item.price : 0,
    size: item.size ?? "",
    color: item.color ?? "",
    quantity: Number.isFinite(item.quantity) ? item.quantity : 1,
    imageUrl: item.imageUrl ?? "",
    savedForLater: Boolean(item.savedForLater),
    variantSku: item.variantSku ?? null,
    addedAt: item.addedAt ?? null,
  };
};

const normalizeCartResponse = (response) => {
  const payload =
    response?.data?.cart ?? response?.cart ?? response?.data ?? response ?? null;

  if (!payload || typeof payload !== "object") {
    return createEmptyCart();
  }

  const items = Array.isArray(payload.items)
    ? payload.items.map(normalizeCartItem).filter(Boolean)
    : [];

  return {
    id: payload.id ?? null,
    items,
    totals: {
      ...DEFAULT_TOTALS,
      ...(payload.totals && typeof payload.totals === "object"
        ? payload.totals
        : {}),
    },
    lastActivityAt: payload.lastActivityAt ?? null,
  };
};

export const fetchCart = async ({ signal } = {}) => {
  const response = await apiRequest("/cart", { signal });
  return normalizeCartResponse(response);
};

export const addCartItem = async (payload) => {
  const response = await apiRequest("/cart/items", {
    method: "POST",
    body: payload,
  });
  return normalizeCartResponse(response);
};

export const updateCartItem = async (itemId, payload) => {
  const response = await apiRequest(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: payload,
  });
  return normalizeCartResponse(response);
};

export const removeCartItem = async (itemId) => {
  const response = await apiRequest(`/cart/items/${itemId}`, {
    method: "DELETE",
  });
  return normalizeCartResponse(response);
};

export const saveCartItemForLater = async (itemId) => {
  const response = await apiRequest(`/cart/items/${itemId}/save-for-later`, {
    method: "PATCH",
  });
  return normalizeCartResponse(response);
};

export const moveCartItemToCart = async (itemId) => {
  const response = await apiRequest(`/cart/items/${itemId}/move-to-cart`, {
    method: "PATCH",
  });
  return normalizeCartResponse(response);
};

export const clearCart = async () => {
  const response = await apiRequest("/cart", {
    method: "DELETE",
  });
  return normalizeCartResponse(response);
};

export const fetchCartSummary = async ({ signal } = {}) => {
  const response = await apiRequest("/cart/summary", { signal });
  return response?.data ?? response ?? null;
};

export const validateCart = async () => {
  const response = await apiRequest("/cart/validate", {
    method: "POST",
  });
  const rawCart = response?.data?.cart ?? response?.cart ?? null;
  return {
    ...(response?.data ?? {}),
    cart: normalizeCartResponse(rawCart),
  };
};

export const emptyCart = createEmptyCart;
