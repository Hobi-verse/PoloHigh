import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCoupon,
  deleteCoupon,
  fetchAdminCoupons,
  fetchCouponAnalytics,
  toggleCouponStatus,
} from "../../api/coupons.js";
import { formatINR } from "../../utils/currency.js";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
];

const discountTypeOptions = [
  { value: "all", label: "All discount types" },
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed amount" },
  { value: "freeShipping", label: "Free shipping" },
];

const campaignTypeOptions = [
  { value: "all", label: "All campaigns" },
  { value: "promotional", label: "Promotional" },
  { value: "seasonal", label: "Seasonal" },
  { value: "referral", label: "Referral" },
  { value: "loyalty", label: "Loyalty" },
  { value: "custom", label: "Custom" },
];

const formatDateLabel = (value) => {
  if (!value) {
    return "--";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const resolveErrorMessage = (error, fallback) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error?.payload?.message) {
    return error.payload.message;
  }

  if (error?.payload?.data?.message) {
    return error.payload.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

const getStatusToken = (coupon) => {
  if (!coupon) {
    return { label: "--", tone: "bg-slate-200 text-slate-700" };
  }

  if (coupon.isExpired) {
    return {
      label: "Expired",
      tone: "bg-rose-100 text-rose-600",
    };
  }

  if (!coupon.isEnabled) {
    return {
      label: "Disabled",
      tone: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: coupon.isActive ? "Active" : "Inactive",
    tone: coupon.isActive
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-200 text-slate-700",
  };
};

const defaultCouponFormValues = () => ({
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscount: "",
  minOrderAmount: "",
  startDate: "",
  endDate: "",
  usageLimitTotal: "",
  usageLimitPerUser: "",
  campaignType: "promotional",
  isActive: true,
});

const Coupons = () => {
  const [filters, setFilters] = useState({
    status: "all",
    discountType: "all",
    campaignType: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    perPage: 10,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const queryParams = useMemo(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (filters.status !== "all") {
      params.status = filters.status;
    }
    if (filters.discountType !== "all") {
      params.discountType = filters.discountType;
    }
    if (filters.campaignType !== "all") {
      params.campaignType = filters.campaignType;
    }
    if (filters.search.trim()) {
      params.search = filters.search.trim();
    }

    return params;
  }, [filters, pagination]);

  const loadCoupons = useCallback(
    async ({ signal } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminCoupons(queryParams, { signal });
        if (signal?.aborted) {
          return;
        }

        setCoupons(response.coupons ?? []);
        setPaginationMeta({
          total: response.pagination?.total ?? 0,
          totalPages: response.pagination?.totalPages ?? 1,
          page: response.pagination?.currentPage ?? queryParams.page ?? 1,
          perPage: response.pagination?.perPage ?? queryParams.limit ?? 10,
        });
      } catch (apiError) {
        if (signal?.aborted) {
          return;
        }

        setCoupons([]);
        setError(apiError);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [queryParams]
  );

  const loadAnalytics = useCallback(
    async ({ signal } = {}) => {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      try {
        const params = {};
        if (filters.campaignType !== "all") {
          params.campaignType = filters.campaignType;
        }
        const response = await fetchCouponAnalytics(params, { signal });
        if (signal?.aborted) {
          return;
        }

        setAnalytics(response.analytics ?? null);
      } catch (apiError) {
        if (signal?.aborted) {
          return;
        }

        setAnalytics(null);
        setAnalyticsError(apiError);
      } finally {
        if (!signal?.aborted) {
          setAnalyticsLoading(false);
        }
      }
    },
    [filters.campaignType]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadCoupons({ signal: controller.signal });
    return () => controller.abort();
  }, [loadCoupons, refreshIndex]);

  useEffect(() => {
    const controller = new AbortController();
    loadAnalytics({ signal: controller.signal });
    return () => controller.abort();
  }, [loadAnalytics]);

  useEffect(() => {
    if (!actionMessage && !actionError) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setActionMessage("");
      setActionError("");
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [actionMessage, actionError]);

  const metrics = useMemo(() => {
    const total = paginationMeta.total;
    const active = coupons.filter((coupon) => coupon.isActive).length;
    const disabled = coupons.filter((coupon) => !coupon.isEnabled).length;
    const expiringSoon = coupons.filter((coupon) => {
      if (!coupon.validity?.end) {
        return false;
      }
      const endDate = new Date(coupon.validity.end);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return days >= 0 && days < 7;
    }).length;

    return {
      total,
      active,
      disabled,
      expiringSoon,
    };
  }, [coupons, paginationMeta.total]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const searchValue = form.get("couponSearch")?.toString() ?? "";
    setFilters((current) => ({
      ...current,
      search: searchValue,
    }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      discountType: "all",
      campaignType: "all",
      search: "",
    });
    setPagination({ page: 1, limit: 10 });
  };

  const handleChangePage = (direction) => {
    setPagination((current) => {
      const nextPage = Math.min(
        Math.max(1, current.page + direction),
        paginationMeta.totalPages || 1
      );
      if (nextPage === current.page) {
        return current;
      }
      return { ...current, page: nextPage };
    });
  };

  const handleToggleStatus = async (couponId) => {
    if (!couponId) {
      return;
    }

    setActionError("");
    setActionMessage("");

    try {
      const response = await toggleCouponStatus(couponId);
      setCoupons((current) =>
        current.map((coupon) => {
          if (coupon.id !== couponId) {
            return coupon;
          }

          const nextEnabled = response.data?.isActive ?? !coupon.isEnabled;
          const nextActive = nextEnabled && !coupon.isExpired;
          return {
            ...coupon,
            isEnabled: nextEnabled,
            isActive: nextActive,
          };
        })
      );
      setActionMessage(response.message ?? "Coupon status updated.");
    } catch (apiError) {
      setActionError(
        resolveErrorMessage(apiError, "Unable to update coupon status.")
      );
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!couponId) {
      return;
    }

    setActionError("");
    setActionMessage("");

    try {
      await deleteCoupon(couponId);
      setCoupons((current) =>
        current.filter((coupon) => coupon.id !== couponId)
      );
      setActionMessage("Coupon deleted successfully.");
      setIsRefreshing(true);
      setRefreshIndex((value) => value + 1);
    } catch (apiError) {
      setActionError(resolveErrorMessage(apiError, "Unable to delete coupon."));
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshIndex((value) => value + 1);
  };

  const handleCreateCoupon = async (formValues) => {
    setActionError("");
    setActionMessage("");

    try {
      const response = await createCoupon(formValues);
      if (response?.coupon) {
        setCoupons((current) => [response.coupon, ...current]);
      }
      setActionMessage(response?.message ?? "Coupon created successfully.");
      setIsRefreshing(true);
      setRefreshIndex((value) => value + 1);
      return response;
    } catch (apiError) {
      const message = resolveErrorMessage(apiError, "Unable to create coupon.");
      setActionError(message);
      throw new Error(message);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400/80">
            Promotions
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Coupons</h1>
          <p className="text-sm text-slate-600">
            Monitor coupon performance and keep your offers fresh.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-emerald-600 px-4 py-2 font-semibold uppercase tracking-[0.25em] text-white shadow-sm transition hover:bg-emerald-500"
          >
            New coupon
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-full border border-emerald-300/60 px-4 py-2 font-semibold uppercase tracking-[0.25em] text-emerald-600 transition hover:border-emerald-400 hover:text-emerald-800"
            disabled={isRefreshing || loading}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-full border border-slate-300 px-4 py-2 font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
          >
            Reset filters
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100/60 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600/80">
            Total coupons
          </p>
          <p className="text-2xl font-semibold text-emerald-900">
            {metrics.total}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100/60 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600/80">
            Active now
          </p>
          <p className="text-2xl font-semibold text-emerald-900">
            {metrics.active}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-100/70 bg-amber-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600/80">
            Disabled
          </p>
          <p className="text-2xl font-semibold text-amber-800">
            {metrics.disabled}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-100/70 bg-rose-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600/80">
            Expiring soon
          </p>
          <p className="text-2xl font-semibold text-rose-800">
            {metrics.expiringSoon}
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSearchSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm md:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.2fr)]"
      >
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Status
          <select
            value={filters.status}
            onChange={(event) =>
              handleFilterChange("status", event.target.value)
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Discount type
          <select
            value={filters.discountType}
            onChange={(event) =>
              handleFilterChange("discountType", event.target.value)
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {discountTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Campaign
          <select
            value={filters.campaignType}
            onChange={(event) =>
              handleFilterChange("campaignType", event.target.value)
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {campaignTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Search
          <div className="flex gap-3">
            <input
              type="search"
              name="couponSearch"
              defaultValue={filters.search}
              placeholder="Search by code or description"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-400"
            >
              Search
            </button>
          </div>
        </label>
      </form>

      {actionMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Coupon list
            </h2>
            <p className="text-sm text-slate-500">
              Showing page {paginationMeta.page} of {paginationMeta.totalPages}.
            </p>
          </div>
          {loading ? (
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Loading...
            </span>
          ) : null}
        </header>

        {error ? (
          <div className="px-6 py-10 text-center text-sm text-rose-600">
            {resolveErrorMessage(error, "Unable to load coupons right now.")}
          </div>
        ) : loading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Fetching coupons...
          </div>
        ) : coupons.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left">Coupon</th>
                  <th className="px-6 py-3 text-left">Discount</th>
                  <th className="px-6 py-3 text-left">Validity</th>
                  <th className="px-6 py-3 text-left">Usage</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {coupons.map((coupon) => {
                  const statusToken = getStatusToken(coupon);
                  const discountLabel =
                    coupon.discountType === "percentage"
                      ? `${coupon.discountValue}%`
                      : coupon.discountType === "fixed"
                      ? formatINR(coupon.discountValue)
                      : "Free shipping";

                  const minOrderLabel = coupon.minOrderAmount
                    ? `Min ${formatINR(coupon.minOrderAmount)}`
                    : "No min";

                  const usageLimit = coupon.usageLimit?.total ?? null;
                  const remaining = coupon.usageRemaining;
                  const usageSummary = usageLimit
                    ? `${coupon.usageCount}/${usageLimit}`
                    : `${coupon.usageCount} used`;

                  return (
                    <tr key={coupon.id ?? coupon.code}>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold tracking-[0.35em] text-slate-900">
                              {coupon.code}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.25em] ${statusToken.tone}`}
                            >
                              {statusToken.label}
                            </span>
                          </div>
                          {coupon.description ? (
                            <p className="text-xs text-slate-500">
                              {coupon.description}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            <span>{coupon.campaignType || "General"}</span>
                            <span>{minOrderLabel}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">
                            {discountLabel}
                          </p>
                          {coupon.maxDiscount ? (
                            <p className="text-xs text-slate-500">
                              Cap {formatINR(coupon.maxDiscount)}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1 text-xs text-slate-500">
                          <p>
                            Starts {formatDateLabel(coupon.validity?.start)}
                          </p>
                          <p>Ends {formatDateLabel(coupon.validity?.end)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1 text-xs text-slate-500">
                          <p>{usageSummary}</p>
                          {remaining !== null && remaining !== undefined ? (
                            <p>Remaining: {remaining}</p>
                          ) : null}
                          {coupon.userUsageRemaining !== null &&
                          coupon.userUsageRemaining !== undefined ? (
                            <p>Per user: {coupon.userUsageRemaining} left</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1 text-xs text-slate-500">
                          <p>{coupon.isEnabled ? "Enabled" : "Disabled"}</p>
                          <p>{coupon.isActive ? "Active now" : "Not active"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.25em]">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon.id)}
                            className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600 transition hover:border-emerald-300 hover:text-emerald-700"
                          >
                            {coupon.isEnabled ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            disabled={coupon.usageCount > 0}
                            className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:border-rose-100 disabled:text-rose-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No coupons found for the selected filters.
          </div>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
          <span>
            Page {paginationMeta.page} of {paginationMeta.totalPages} ·{" "}
            {paginationMeta.total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleChangePage(-1)}
              disabled={paginationMeta.page <= 1}
              className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handleChangePage(1)}
              disabled={paginationMeta.page >= paginationMeta.totalPages}
              className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Analytics</h2>
            <p className="text-sm text-slate-500">
              Insights generated from coupon usage.
            </p>
          </div>
          {analyticsLoading ? (
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Loading...
            </span>
          ) : null}
        </header>

        {analyticsError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {resolveErrorMessage(
              analyticsError,
              "Unable to load analytics right now."
            )}
          </div>
        ) : analytics ? (
          <div className="mt-5 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Total usage
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {analytics.totalUsage}
              </p>
              <p className="text-xs text-slate-500">
                Across all coupons within the selected view.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Total savings
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {formatINR(analytics.totalDiscountGiven)}
              </p>
              <p className="text-xs text-slate-500">
                Discount total passed on to customers.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Avg per coupon
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {formatINR(analytics.averageDiscountPerCoupon)}
              </p>
              <p className="text-xs text-slate-500">
                Based on total discount distributed.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 text-sm text-slate-500">
            No analytics available for the selected filters yet.
          </div>
        )}
      </section>

      <CreateCouponModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCoupon}
      />
    </div>
  );
};

export default Coupons;

const CreateCouponModal = ({ open, onClose, onSubmit }) => {
  const [formValues, setFormValues] = useState(() => defaultCouponFormValues());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setFormValues(defaultCouponFormValues());
      setSaving(false);
      setError("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormValues((current) => {
      if (name === "discountType") {
        return {
          ...current,
          discountType: value,
          discountValue: value === "freeShipping" ? "0" : current.discountValue,
        };
      }

      if (name === "code") {
        return {
          ...current,
          code: value.toUpperCase(),
        };
      }

      if (type === "checkbox") {
        return {
          ...current,
          [name]: checked,
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  const validate = () => {
    if (!formValues.code.trim()) {
      return "Coupon code is required.";
    }

    if (!formValues.startDate) {
      return "Start date is required.";
    }

    if (!formValues.endDate) {
      return "End date is required.";
    }

    if (new Date(formValues.endDate) <= new Date(formValues.startDate)) {
      return "End date must be after the start date.";
    }

    if (
      formValues.discountType !== "freeShipping" &&
      (!formValues.discountValue ||
        Number.parseFloat(formValues.discountValue) <= 0)
    ) {
      return "Provide a valid discount value.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      code: formValues.code.trim().toUpperCase(),
      description: formValues.description.trim() || undefined,
      discountType: formValues.discountType,
      discountValue:
        formValues.discountType === "freeShipping"
          ? 0
          : Number.parseFloat(formValues.discountValue),
      validity: {
        startDate: formValues.startDate,
        endDate: formValues.endDate,
      },
      isActive: formValues.isActive,
      campaignType: formValues.campaignType,
    };

    if (formValues.maxDiscount) {
      payload.maxDiscount = Number.parseFloat(formValues.maxDiscount);
    }

    if (formValues.minOrderAmount) {
      payload.minOrderAmount = Number.parseFloat(formValues.minOrderAmount);
    }

    const usageLimit = {};
    if (formValues.usageLimitTotal) {
      usageLimit.total = Number.parseInt(formValues.usageLimitTotal, 10);
    }
    if (formValues.usageLimitPerUser) {
      usageLimit.perUser = Number.parseInt(formValues.usageLimitPerUser, 10);
    }

    if (Object.keys(usageLimit).length) {
      payload.usageLimit = usageLimit;
    }

    try {
      await onSubmit?.(payload);
      setSaving(false);
      onClose?.();
    } catch (submitError) {
      setError(submitError?.message || "Unable to create coupon right now.");
      setSaving(false);
    }
  };

  const filteredCampaignOptions = campaignTypeOptions.filter(
    (option) => option.value !== "all"
  );

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !saving) {
      onClose?.();
    }
  };

  const discountDisabled = formValues.discountType === "freeShipping";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-coupon-title"
      onClick={handleOverlayClick}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white p-6 text-slate-800 shadow-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">
              New coupon
            </p>
            <h2
              id="create-coupon-title"
              className="mt-1 text-2xl font-semibold text-slate-900"
            >
              Create coupon
            </h2>
            <p className="text-sm text-slate-500">
              Configure the discount details before sharing with customers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose?.()}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Coupon code
            <input
              type="text"
              name="code"
              value={formValues.code}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="SAVE25"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Campaign
            <select
              name="campaignType"
              value={formValues.campaignType}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            >
              {filteredCampaignOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
            Description
            <textarea
              name="description"
              value={formValues.description}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              rows={3}
              placeholder="Optional details customers should know"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Discount type
            <select
              name="discountType"
              value={formValues.discountType}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
            >
              {discountTypeOptions
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Discount value
            <input
              type="number"
              name="discountValue"
              value={formValues.discountValue}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder={discountDisabled ? "0" : "e.g. 20"}
              min="0"
              step="0.01"
              required={!discountDisabled}
              disabled={discountDisabled}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Max discount (optional)
            <input
              type="number"
              name="maxDiscount"
              value={formValues.maxDiscount}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="Cap in INR"
              min="0"
              step="0.01"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Minimum order (optional)
            <input
              type="number"
              name="minOrderAmount"
              value={formValues.minOrderAmount}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="Amount in INR"
              min="0"
              step="0.01"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Start date
            <input
              type="date"
              name="startDate"
              value={formValues.startDate}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            End date
            <input
              type="date"
              name="endDate"
              value={formValues.endDate}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Total usage limit (optional)
            <input
              type="number"
              name="usageLimitTotal"
              value={formValues.usageLimitTotal}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              min="1"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Per-user limit (optional)
            <input
              type="number"
              name="usageLimitPerUser"
              value={formValues.usageLimitPerUser}
              onChange={handleFieldChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              min="1"
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formValues.isActive}
              onChange={handleFieldChange}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Enable coupon immediately
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            All fields can be edited later from the coupon list.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-[9rem] items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create coupon"}
          </button>
        </div>
      </form>
    </div>
  );
};
