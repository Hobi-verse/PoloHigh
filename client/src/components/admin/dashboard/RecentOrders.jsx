import { useEffect, useState } from "react";
import { fetchRecentOrders } from "../../../api/admin.js";
import formatINR from "../../../utils/currency.js";

const statusClassMap = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-sky-100 text-sky-700",
  processing: "bg-amber-100 text-amber-700",
  packed: "bg-slate-200 text-slate-700",
  shipped: "bg-blue-100 text-blue-700",
  "out-for-delivery": "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  refunded: "bg-slate-200 text-slate-700",
};

const formatStatusLabel = (status) => {
  if (!status) {
    return "Unknown";
  }

  return status
    .toString()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (value) =>
  typeof value === "number" && Number.isFinite(value) ? formatINR(value) : "—";

const RecentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchRecentOrders({ limit: 5 });
        if (isMounted) {
          setOrders(Array.isArray(response?.results) ? response.results : []);
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

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="flex-1 rounded-2xl border border-emerald-100 bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-emerald-100 bg-emerald-600/95 px-6 py-4 text-white">
        <div>
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <p className="text-sm text-emerald-100/80">
            Latest orders awaiting action
          </p>
        </div>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]">
          Live
        </span>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-emerald-50 text-left text-sm text-slate-700">
          <thead className="bg-emerald-50/90 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <tr>
              <th className="px-6 py-3">Order ID</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Placed</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {error ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-center text-sm text-rose-600"
                >
                  Unable to load recent orders.
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-center text-sm text-emerald-600"
                >
                  Loading orders...
                </td>
              </tr>
            ) : orders.length ? (
              orders.map((order, index) => (
                <tr
                  key={order.id ?? order.orderNumber ?? `recent-order-${index}`}
                  className="hover:bg-emerald-50/60"
                >
                  <td className="px-6 py-4 font-semibold text-emerald-700">
                    {order.orderNumber || order.id || "—"}
                    {typeof order.grandTotal === "number" && (
                      <div className="text-xs font-normal text-slate-500">
                        {formatCurrency(order.grandTotal)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700">
                      {order.customerName || "—"}
                    </div>
                    {order.customerEmail && (
                      <div className="text-xs text-slate-500">
                        {order.customerEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {formatDateLabel(order.placedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        statusClassMap[order.status] ??
                        "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {formatStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-center text-sm text-slate-500"
                >
                  No recent orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default RecentOrders;
