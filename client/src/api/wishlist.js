import { apiRequest } from "./client";

const DEFAULT_WISHLIST = Object.freeze({
  id: null,
  name: "",
  isPublic: false,
  items: [],
  itemCount: 0,
  lastActivityAt: null,
});

const extractWishlistPayload = (payload) =>
  payload?.data?.wishlist ?? payload?.wishlist ?? payload?.data ?? payload ?? null;

const normalizeWishlistItem = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const rawProduct = item.productId;
  const productId =
    typeof rawProduct === "string"
      ? rawProduct
      : rawProduct?.slug ?? rawProduct?._id ?? rawProduct?.id ?? null;

  const normalizedPrice = Number(item.price);

  return {
    id: item.id ?? item._id ?? productId ?? item.variantSku ?? null,
    productId,
    title: item.title ?? "",
    price: Number.isFinite(normalizedPrice) ? normalizedPrice : 0,
    size: item.size ?? null,
    color: item.color ?? null,
    imageUrl: item.imageUrl ?? null,
    inStock: item.inStock !== false,
    priority: item.priority ?? "medium",
    notes: item.notes ?? "",
    addedAt: item.addedAt ?? null,
    variantSku: item.variantSku ?? null,
  };
};

const normalizeWishlist = (input) => {
  const wishlist = extractWishlistPayload(input);

  if (!wishlist || typeof wishlist !== "object") {
    return { ...DEFAULT_WISHLIST };
  }

  const items = Array.isArray(wishlist.items)
    ? wishlist.items.map(normalizeWishlistItem).filter(Boolean)
    : [];

  const itemCountValue = Number(wishlist.itemCount);

  return {
    id: wishlist.id ?? wishlist._id ?? DEFAULT_WISHLIST.id,
    name: wishlist.name ?? DEFAULT_WISHLIST.name,
    isPublic: Boolean(wishlist.isPublic),
    items,
    itemCount: Number.isFinite(itemCountValue) ? itemCountValue : items.length,
    lastActivityAt: wishlist.lastActivityAt ?? DEFAULT_WISHLIST.lastActivityAt,
  };
};

export const emptyWishlist = () => ({ ...DEFAULT_WISHLIST, items: [] });

export const fetchWishlist = async ({ signal } = {}) => {
  const payload = await apiRequest("/wishlist", { signal });
  return normalizeWishlist(payload);
};

export const addWishlistItem = async (payload, { signal } = {}) => {
  const response = await apiRequest("/wishlist", {
    method: "POST",
    body: payload,
    signal,
  });

  return normalizeWishlist(response);
};

export const updateWishlistItem = async (itemId, payload, { signal } = {}) => {
  if (!itemId) {
    throw new Error("updateWishlistItem requires an itemId");
  }

  const response = await apiRequest(`/wishlist/${itemId}`, {
    method: "PATCH",
    body: payload,
    signal,
  });

  return normalizeWishlist(response);
};

export const removeWishlistItem = async (itemId, { signal } = {}) => {
  if (!itemId) {
    throw new Error("removeWishlistItem requires an itemId");
  }

  const response = await apiRequest(`/wishlist/${itemId}`, {
    method: "DELETE",
    signal,
  });

  return normalizeWishlist(response);
};

export const clearWishlist = async ({ signal } = {}) => {
  const response = await apiRequest("/wishlist", {
    method: "DELETE",
    signal,
  });

  return normalizeWishlist(response);
};

export const moveWishlistItemToCart = async (itemId, payload = {}, { signal } = {}) => {
  if (!itemId) {
    throw new Error("moveWishlistItemToCart requires an itemId");
  }

  const response = await apiRequest(`/wishlist/${itemId}/move-to-cart`, {
    method: "POST",
    body: payload,
    signal,
  });

  return {
    wishlist: normalizeWishlist(response),
    cart: response?.data?.cart ?? null,
  };
};

export const fetchWishlistSummary = async ({ signal } = {}) => {
  const response = await apiRequest("/wishlist/summary", { signal });
  const data = response?.data ?? response ?? {};

  return {
    itemCount: Number.isFinite(Number(data.itemCount))
      ? Number(data.itemCount)
      : 0,
  };
};

export const checkProductInWishlist = async (productId, { signal } = {}) => {
  if (!productId) {
    throw new Error("checkProductInWishlist requires a productId");
  }

  const response = await apiRequest(`/wishlist/check/${productId}`, {
    method: "GET",
    signal,
  });

  const data = response?.data ?? response ?? {};

  return {
    inWishlist: Boolean(data.inWishlist),
    itemId: data.itemId ?? null,
  };
};

export const syncWishlist = async ({ signal } = {}) => {
  const response = await apiRequest("/wishlist/sync", {
    method: "POST",
    signal,
  });

  return normalizeWishlist(response);
};
