import { useEffect, useMemo, useState } from "react";
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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchRecentOrders({ limit: 25 });
        if (isMounted) {
          setOrders(Array.isArray(response?.results) ? response.results : []);
          setPagination(response?.pagination ?? null);
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

  const totalOrders = useMemo(() => {
    if (pagination?.total) {
      return pagination.total;
    }

    return orders.length;
  }, [orders.length, pagination]);

  return (
    <section className="space-y-7 text-slate-800">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Orders</h2>
        <p className="text-base text-slate-500">
          Track and manage recent customer orders with live status updates.
        </p>
        <p className="text-sm text-slate-400">
          Showing {orders.length} of {totalOrders} orders
        </p>
      </header>
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
        <table className="min-w-full divide-y divide-emerald-50">
          <thead className="bg-emerald-600/95 text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50 text-sm">
            {error ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-sm text-rose-600"
                >
                  Unable to load orders.
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-sm text-emerald-600"
                >
                  Loading orders...
                </td>
              </tr>
            ) : orders.length ? (
              orders.map((order, index) => (
                <tr
                  key={order.id ?? order.orderNumber ?? `order-${index}`}
                  className="hover:bg-emerald-50/60"
                >
                  <td className="px-6 py-4 font-semibold text-emerald-700">
                    {order.orderNumber || order.id || "—"}
                    {typeof order.itemsCount === "number" && (
                      <span className="ml-2 text-xs font-medium text-slate-400">
                        {order.itemsCount} item
                        {order.itemsCount === 1 ? "" : "s"}
                      </span>
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
                  <td className="px-6 py-4 text-slate-500">
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
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {formatCurrency(order.grandTotal)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-6 text-center text-sm text-slate-500"
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Orders;
