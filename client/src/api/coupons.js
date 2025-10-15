import { apiRequest } from "./client";

const normalizeCouponSummary = (coupon = {}) => {
  const id = coupon._id ?? coupon.id ?? coupon.couponId ?? null;
  const rawEnabled = coupon.isActive ?? coupon.isEnabled ?? false;
  const normalized = {
    id,
    code: coupon.code ?? "",
    description: coupon.description ?? "",
    discountType: coupon.discountType ?? "",
    discountValue: Number.isFinite(coupon.discountValue)
      ? coupon.discountValue
      : 0,
    maxDiscount: Number.isFinite(coupon.maxDiscount)
      ? coupon.maxDiscount
      : null,
    minOrderAmount: Number.isFinite(coupon.minOrderAmount)
      ? coupon.minOrderAmount
      : 0,
    validity: {
      start: coupon.validity?.startDate ?? coupon.validFrom ?? null,
      end:
        coupon.validity?.endDate ?? coupon.validUntil ?? coupon.validTo ?? null,
    },
    campaignType: coupon.campaignType ?? "",
    isActive:
      typeof coupon.isCurrentlyActive === "boolean"
        ? coupon.isCurrentlyActive
        : rawEnabled && !coupon.isExpired,
    isEnabled: rawEnabled,
    isExpired: Boolean(coupon.isExpired),
    usageCount: Number.isFinite(coupon.usageCount) ? coupon.usageCount : 0,
    usageRemaining: coupon.remainingUsage ?? coupon.usageRemaining ?? null,
    userUsageRemaining:
      coupon.userUsageRemaining ?? coupon.usageLimit?.perUser ?? null,
    usageLimit:
      coupon.usageLimit && typeof coupon.usageLimit === "object"
        ? {
          total:
            coupon.usageLimit.total ??
            (coupon.remainingUsage === "Unlimited" ? null : null),
          perUser: coupon.usageLimit.perUser ?? null,
        }
        : {
          total: coupon.usageLimitTotal ?? null,
          perUser: coupon.usageLimitPerUser ?? null,
        },
    usagePercentage: Number.parseFloat(coupon.usagePercentage ?? 0) || 0,
    createdAt: coupon.createdAt ?? null,
    updatedAt: coupon.updatedAt ?? null,
    createdBy: coupon.createdBy
      ? {
        id: coupon.createdBy._id ?? coupon.createdBy.id ?? null,
        name: coupon.createdBy.name ?? "",
        email: coupon.createdBy.email ?? "",
      }
      : null,
    maxRedemptions:
      coupon.usageLimit?.total ??
      (coupon.remainingUsage === "Unlimited" ? null : coupon.remainingUsage ?? null),
  };

  if (normalized.usageRemaining === "Unlimited") {
    normalized.usageRemaining = null;
  }

  return normalized;
};

const normalizeCouponValidation = (payload = {}) => {
  return {
    id: payload.couponId ?? payload.id ?? null,
    code: payload.code ?? "",
    discountType: payload.discountType ?? "",
    discountValue: Number.isFinite(payload.discountValue)
      ? payload.discountValue
      : 0,
    discountApplied: Number.isFinite(payload.discountApplied)
      ? payload.discountApplied
      : 0,
    finalAmount: Number.isFinite(payload.finalAmount)
      ? payload.finalAmount
      : null,
    freeShipping: Boolean(payload.freeShipping),
  };
};

const normalizeCouponAnalytics = (payload = {}) => {
  return {
    totalCoupons: payload.totalCoupons ?? 0,
    activeCoupons: payload.activeCoupons ?? 0,
    expiredCoupons: payload.expiredCoupons ?? 0,
    totalUsage: payload.totalUsage ?? 0,
    totalDiscountGiven: Number.parseFloat(payload.totalDiscountGiven ?? 0) || 0,
    averageDiscountPerCoupon:
      Number.parseFloat(payload.averageDiscountPerCoupon ?? 0) || 0,
    byDiscountType: payload.byDiscountType ?? {},
    byCampaignType: payload.byCampaignType ?? {},
    topPerformingCoupons: Array.isArray(payload.topPerformingCoupons)
      ? payload.topPerformingCoupons.map((coupon) => ({
        code: coupon.code ?? "",
        usageCount: coupon.usageCount ?? 0,
        discountType: coupon.discountType ?? "",
        discountValue: Number.isFinite(coupon.discountValue)
          ? coupon.discountValue
          : 0,
        totalDiscountGiven:
          Number.parseFloat(coupon.totalDiscountGiven ?? 0) || 0,
      }))
      : [],
  };
};

export const fetchAvailableCoupons = async ({ signal } = {}) => {
  const response = await apiRequest("/coupons/available", { signal });
  const coupons = Array.isArray(response?.data)
    ? response.data.map((coupon) =>
      normalizeCouponSummary({
        ...coupon,
        validity: { endDate: coupon.validUntil ?? null },
      })
    )
    : [];

  return {
    success: response?.success ?? true,
    count: response?.count ?? coupons.length,
    coupons,
    raw: response,
  };
};

export const fetchUserCouponUsage = async ({ signal } = {}) => {
  const response = await apiRequest("/coupons/my-usage", { signal });
  const usage = Array.isArray(response?.data)
    ? response.data.map((entry) => ({
      couponCode: entry.couponCode ?? "",
      description: entry.description ?? "",
      discountType: entry.discountType ?? "",
      discountApplied: Number.isFinite(entry.discountApplied)
        ? entry.discountApplied
        : 0,
      usedAt: entry.usedAt ?? null,
      orderId: entry.orderId ?? null,
    }))
    : [];

  return {
    success: response?.success ?? true,
    count: response?.count ?? usage.length,
    usage,
    raw: response,
  };
};

export const validateCoupon = async (
  { code, orderAmount, items } = {},
  { signal } = {}
) => {
  if (!code) {
    throw new Error("validateCoupon requires a coupon code");
  }

  const response = await apiRequest("/coupons/validate", {
    method: "POST",
    body: { code, orderAmount, items },
    signal,
  });

  const payload = response?.data ?? response;
  return {
    success: response?.success ?? true,
    message: response?.message ?? "Coupon validated",
    coupon: normalizeCouponValidation(payload),
    raw: response,
  };
};

export const autoApplyBestCoupon = async (
  { orderAmount, items } = {},
  { signal } = {}
) => {
  const response = await apiRequest("/coupons/auto-apply", {
    method: "POST",
    body: { orderAmount, items },
    signal,
  });

  const payload = response?.data ?? response;
  return {
    success: response?.success ?? true,
    message: response?.message ?? "Coupon applied",
    coupon: normalizeCouponValidation(payload),
    raw: response,
  };
};

export const fetchAdminCoupons = async (params = {}, { signal } = {}) => {
  const response = await apiRequest("/coupons/admin/all", {
    query: params,
    signal,
  });

  const coupons = Array.isArray(response?.data)
    ? response.data.map((coupon) => normalizeCouponSummary(coupon))
    : [];

  return {
    success: response?.success ?? true,
    coupons,
    pagination: {
      count: response?.count ?? coupons.length,
      total: response?.total ?? coupons.length,
      totalPages: response?.totalPages ?? 1,
      currentPage: response?.currentPage ?? 1,
      perPage: params.limit ? Number(params.limit) : coupons.length,
    },
    raw: response,
  };
};

export const fetchCouponById = async (couponId, { signal } = {}) => {
  if (!couponId) {
    throw new Error("fetchCouponById requires an id");
  }

  const response = await apiRequest(`/coupons/admin/${couponId}`, {
    signal,
  });

  const payload = response?.data ?? response;
  return {
    success: response?.success ?? true,
    coupon: normalizeCouponSummary(payload),
    analytics: payload?.analytics
      ? normalizeCouponAnalytics(payload.analytics)
      : null,
    raw: response,
  };
};

export const createCoupon = async (payload, { signal } = {}) => {
  const response = await apiRequest("/coupons/admin/create", {
    method: "POST",
    body: payload,
    signal,
  });

  return {
    success: response?.success ?? true,
    message: response?.message ?? "Coupon created",
    coupon: normalizeCouponSummary(response?.data ?? response),
    raw: response,
  };
};

export const updateCoupon = async (couponId, payload, { signal } = {}) => {
  if (!couponId) {
    throw new Error("updateCoupon requires an id");
  }

  const response = await apiRequest(`/coupons/admin/${couponId}`, {
    method: "PUT",
    body: payload,
    signal,
  });

  return {
    success: response?.success ?? true,
    message: response?.message ?? "Coupon updated",
    coupon: normalizeCouponSummary(response?.data ?? response),
    raw: response,
  };
};

export const deleteCoupon = async (couponId, { signal } = {}) => {
  if (!couponId) {
    throw new Error("deleteCoupon requires an id");
  }

  const response = await apiRequest(`/coupons/admin/${couponId}`, {
    method: "DELETE",
    signal,
  });

  return {
    success: response?.success ?? true,
    message: response?.message ?? "Coupon deleted",
    raw: response,
  };
};

export const toggleCouponStatus = async (couponId, { signal } = {}) => {
  if (!couponId) {
    throw new Error("toggleCouponStatus requires an id");
  }

  const response = await apiRequest(`/coupons/admin/${couponId}/toggle-status`, {
    method: "PATCH",
    signal,
  });

  const payload = response?.data ?? response;

  return {
    success: response?.success ?? true,
    message: response?.message ?? "Coupon status updated",
    data: {
      code: payload?.code ?? "",
      isActive: payload?.isActive ?? false,
    },
    raw: response,
  };
};

export const fetchCouponAnalytics = async (params = {}, { signal } = {}) => {
  const response = await apiRequest("/coupons/admin/analytics", {
    query: params,
    signal,
  });

  const payload = response?.data ?? response;

  return {
    success: response?.success ?? true,
    analytics: normalizeCouponAnalytics(payload),
    raw: response,
  };
};
