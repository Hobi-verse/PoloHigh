import { apiRequest } from "./client";

const normalizeReview = (review = {}) => ({
  id: review.id ?? review._id ?? "",
  product: review.product || null,
  user: review.user || null,
  rating: Number(review.rating ?? 0),
  title: review.title ?? "",
  comment: review.comment ?? "",
  images: Array.isArray(review.images) ? review.images : [],
  isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
  status: review.status ?? "approved",
  helpfulVotes: Number(review.helpfulVotes ?? 0),
  createdAt: review.createdAt ?? null,
  updatedAt: review.updatedAt ?? null,
  moderatedAt: review.moderatedAt ?? null,
  rejectionReason: review.rejectionReason ?? "",
  variant: review.variant ?? {},
  adminResponse: review.adminResponse || null,
});

const normalizeSummary = (summary = {}) => ({
  averageRating: Number(summary.averageRating ?? 0),
  totalReviews: Number(summary.totalReviews ?? 0),
  ratingDistribution: {
    5: Number(summary.ratingDistribution?.[5] ?? 0),
    4: Number(summary.ratingDistribution?.[4] ?? 0),
    3: Number(summary.ratingDistribution?.[3] ?? 0),
    2: Number(summary.ratingDistribution?.[2] ?? 0),
    1: Number(summary.ratingDistribution?.[1] ?? 0),
  },
});

const normalizePagination = (pagination = {}) => ({
  currentPage: Number(pagination.currentPage ?? 1),
  totalPages: Number(pagination.totalPages ?? 1),
  totalReviews: Number(pagination.totalReviews ?? 0),
  hasMore: Boolean(pagination.hasMore),
});

export const fetchProductReviews = async (
  productId,
  { page = 1, limit = 10, rating, sortBy, sortOrder, verified } = {},
  { signal } = {}
) => {
  if (!productId) {
    throw new Error("fetchProductReviews requires a productId");
  }

  const response = await apiRequest(`/reviews/product/${productId}`, {
    method: "GET",
    query: {
      page,
      limit,
      rating,
      sortBy,
      sortOrder,
      verified,
    },
    signal,
  });

  const payload = response?.data ?? response ?? {};
  const reviews = Array.isArray(payload.reviews)
    ? payload.reviews.map((review) => normalizeReview(review))
    : [];

  return {
    reviews,
    summary: normalizeSummary(payload.summary ?? {}),
    pagination: normalizePagination(payload.pagination ?? {}),
  };
};

export const createReview = async (payload) => {
  if (!payload?.productId) {
    throw new Error("createReview requires a productId in payload");
  }

  const response = await apiRequest("/reviews", {
    method: "POST",
    body: payload,
  });

  const data = response?.data ?? response ?? {};
  return normalizeReview(data.review ?? data);
};

export const updateReview = async (reviewId, payload) => {
  if (!reviewId) {
    throw new Error("updateReview requires a reviewId");
  }

  const response = await apiRequest(`/reviews/${reviewId}`, {
    method: "PUT",
    body: payload,
  });

  const data = response?.data ?? response ?? {};
  return normalizeReview(data.review ?? data);
};

export const deleteReview = async (reviewId) => {
  if (!reviewId) {
    throw new Error("deleteReview requires a reviewId");
  }

  await apiRequest(`/reviews/${reviewId}`, {
    method: "DELETE",
  });
};

export const fetchUserReviews = async (
  { page = 1, limit = 10 } = {},
  { signal } = {}
) => {
  const response = await apiRequest("/reviews/user", {
    method: "GET",
    query: { page, limit },
    signal,
  });

  const payload = response?.data ?? response ?? {};
  const reviews = Array.isArray(payload.reviews)
    ? payload.reviews.map((review) => normalizeReview(review))
    : [];

  return {
    reviews,
    pagination: normalizePagination(payload.pagination ?? {}),
  };
};

export const checkReviewEligibility = async (productId, { signal } = {}) => {
  if (!productId) {
    throw new Error("checkReviewEligibility requires a productId");
  }

  const response = await apiRequest(`/reviews/can-review/${productId}`, {
    method: "GET",
    signal,
  });

  const data = response?.data ?? response ?? {};
  return {
    canReview: Boolean(data.canReview),
    hasPurchased: Boolean(data.hasPurchased),
    orderId: data.orderId ?? null,
    message: data.message ?? "",
    reason: data.reason ?? "",
    existingReview: data.existingReview
      ? normalizeReview({ ...data.existingReview, product: { id: productId } })
      : null,
  };
};

export const markReviewHelpful = async (reviewId) => {
  if (!reviewId) {
    throw new Error("markReviewHelpful requires a reviewId");
  }

  const response = await apiRequest(`/reviews/${reviewId}/helpful`, {
    method: "PATCH",
  });

  const data = response?.data ?? response ?? {};
  return {
    helpfulVotes: Number(data.helpfulVotes ?? 0),
  };
};

export const removeReviewHelpful = async (reviewId) => {
  if (!reviewId) {
    throw new Error("removeReviewHelpful requires a reviewId");
  }

  const response = await apiRequest(`/reviews/${reviewId}/helpful`, {
    method: "DELETE",
  });

  const data = response?.data ?? response ?? {};
  return {
    helpfulVotes: Number(data.helpfulVotes ?? 0),
  };
};

export const fetchAdminReviews = async (
  { status, rating, verified, page = 1, limit = 20, sortBy, sortOrder, search } = {},
  { signal } = {}
) => {
  const response = await apiRequest("/reviews/admin/all", {
    method: "GET",
    query: { status, rating, verified, page, limit, sortBy, sortOrder, search },
    signal,
  });

  const payload = response?.data ?? response ?? {};
  const reviews = Array.isArray(payload.reviews)
    ? payload.reviews.map((review) => normalizeReview(review))
    : [];

  return {
    reviews,
    pagination: normalizePagination(payload.pagination ?? {}),
  };
};

export const approveReview = async (reviewId) => {
  if (!reviewId) {
    throw new Error("approveReview requires a reviewId");
  }

  await apiRequest(`/reviews/${reviewId}/approve`, {
    method: "PATCH",
  });
};

export const rejectReview = async (reviewId, reason) => {
  if (!reviewId) {
    throw new Error("rejectReview requires a reviewId");
  }

  await apiRequest(`/reviews/${reviewId}/reject`, {
    method: "PATCH",
    body: reason ? { reason } : undefined,
  });
};

export const respondToReview = async (reviewId, message) => {
  if (!reviewId) {
    throw new Error("respondToReview requires a reviewId");
  }

  if (!message) {
    throw new Error("respondToReview requires a message");
  }

  const response = await apiRequest(`/reviews/${reviewId}/respond`, {
    method: "PATCH",
    body: { message },
  });

  const data = response?.data ?? response ?? {};
  return data.adminResponse ?? data;
};

