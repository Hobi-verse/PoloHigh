import { apiRequest } from "./client";

const normalizeCategory = (category = {}) => {
  const slug = category.slug ?? category.id ?? category._id ?? "";

  return {
    id: category.id ?? category._id ?? slug,
    slug,
    name: category.name ?? slug,
    description: category.description ?? "",
    heroImage: category.heroImage ?? null,
    productCount:
      typeof category.productCount === "number" ? category.productCount : null,
    parent:
      typeof category.parentCategory === "string"
        ? category.parentCategory
        : category.parentCategory?.slug ?? null,
    isActive: category.isActive ?? true,
    raw: category,
  };
};

const normalizeCategoryNode = (node = {}) => {
  const normalized = normalizeCategory(node);

  normalized.children = Array.isArray(node.children)
    ? node.children.map((child) => normalizeCategoryNode(child))
    : [];

  return normalized;
};

export const fetchCategories = async (params = {}, { signal } = {}) => {
  const payload = await apiRequest("/categories", {
    query: params,
    signal,
  });

  const categories = Array.isArray(payload?.categories)
    ? payload.categories.map(normalizeCategory)
    : [];

  return {
    success: payload?.success ?? true,
    count: payload?.count ?? categories.length,
    categories,
    raw: payload,
  };
};

export const fetchCategoryTree = async (params = {}, { signal } = {}) => {
  const payload = await apiRequest("/categories/tree", { 
    query: params,
    signal 
  });

  const categories = Array.isArray(payload?.categories)
    ? payload.categories.map(normalizeCategoryNode)
    : [];

  return {
    success: payload?.success ?? true,
    categories,
    raw: payload,
  };
};

export const fetchCategoryBySlug = async (slug, { signal } = {}) => {
  if (!slug) {
    throw new Error("fetchCategoryBySlug requires a category slug");
  }

  const payload = await apiRequest(`/categories/${slug}`, { signal });
  const category = payload?.category ? normalizeCategory(payload.category) : null;

  return {
    success: payload?.success ?? Boolean(category),
    category,
    raw: payload,
  };
};

export const fetchCategoryFilters = async (slug, { signal } = {}) => {
  if (!slug) {
    throw new Error("fetchCategoryFilters requires a category slug");
  }

  const payload = await apiRequest(`/categories/${slug}/filters`, { signal });
  const filters = payload?.filters ?? {};

  return {
    success: payload?.success ?? true,
    filters,
    raw: payload,
  };
};

export const fetchCategoryProducts = async (
  slug,
  params = {},
  { signal } = {}
) => {
  if (!slug) {
    throw new Error("fetchCategoryProducts requires a category slug");
  }

  const payload = await apiRequest(`/categories/${slug}/products`, {
    query: params,
    signal,
  });

  return {
    success: payload?.success ?? true,
    category: payload?.category ?? null,
    count: payload?.count ?? 0,
    total: payload?.total ?? 0,
    page: payload?.page ?? 1,
    totalPages: payload?.totalPages ?? 1,
    products: Array.isArray(payload?.products) ? payload.products : [],
    raw: payload,
  };
};
