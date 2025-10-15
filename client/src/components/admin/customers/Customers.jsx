import { useEffect, useMemo, useState } from "react";
import { fetchCustomers } from "../../../api/admin.js";
import formatINR from "../../../utils/currency.js";

const formatDateLabel = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatTierLabel = (tier) => {
  if (!tier) {
    return "Standard";
  }

  return tier
    .toString()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatCurrency = (value) =>
  typeof value === "number" && Number.isFinite(value) ? formatINR(value) : "—";

const formatNumber = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-IN").format(value)
    : "—";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [tierDistribution, setTierDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchCustomers({ limit: 25 });
        if (isMounted) {
          setCustomers(
            Array.isArray(response?.results) ? response.results : []
          );
          setPagination(response?.pagination ?? null);
          setTierDistribution(
            Array.isArray(response?.tierDistribution)
              ? response.tierDistribution
              : []
          );
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalCustomers = useMemo(() => {
    if (pagination?.total) {
      return pagination.total;
    }

    return customers.length;
  }, [customers.length, pagination]);

  const leadingTier = useMemo(() => {
    if (!tierDistribution.length) {
      return null;
    }

    const topTier = tierDistribution[0];
    if (!topTier) {
      return null;
    }

    return {
      label: formatTierLabel(topTier.tier),
      count: topTier.count ?? 0,
    };
  }, [tierDistribution]);

  return (
    <section className="space-y-7 text-slate-800">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Customers</h2>
        <p className="text-base text-slate-500">
          View customer details and recent engagement.
        </p>
        <div className="text-sm text-slate-400">
          Showing {customers.length} of {totalCustomers} customers
          {leadingTier ? (
            <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-700">
              Top tier: {leadingTier.label} · {leadingTier.count}
            </span>
          ) : null}
        </div>
      </header>
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
        <table className="min-w-full divide-y divide-emerald-50">
          <thead className="bg-emerald-600/95 text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Membership</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50 text-sm">
            {error ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-sm text-rose-600"
                >
                  Unable to load customers.
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-sm text-emerald-600"
                >
                  Loading customers...
                </td>
              </tr>
            ) : customers.length ? (
              customers.map((customer, index) => (
                <tr
                  key={customer.id ?? customer.userId ?? `customer-${index}`}
                  className="hover:bg-emerald-50/60"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-emerald-700">
                      {customer.name || "—"}
                    </div>
                    <div className="text-xs text-slate-400">
                      ID: {customer.userId ?? customer.id ?? "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">
                      {customer.email || "—"}
                    </div>
                    {customer.phone && (
                      <div className="text-xs text-slate-500">
                        {customer.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {formatTierLabel(customer.membershipTier)}
                    </span>
                    {customer.isVerified ? (
                      <span className="ml-2 text-xs font-medium text-emerald-600">
                        Verified
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700">
                      {formatNumber(customer.totalOrders)} orders
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatCurrency(customer.totalSpent)} spent
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div>
                      Last active: {formatDateLabel(customer.lastUpdated)}
                    </div>
                    <div className="text-xs text-slate-400">
                      Joined {formatDateLabel(customer.joinedAt)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-sm text-slate-500"
                >
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Customers;
