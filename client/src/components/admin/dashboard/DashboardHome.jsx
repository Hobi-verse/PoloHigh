import { useEffect, useState } from "react";
import RecentOrders from "./RecentOrders";
import RecentActivities from "./RecentActivities";
import { fetchDashboardMetrics } from "../../../api/admin.js";
import { formatINR } from "../../../utils/currency.js";

const DashboardHome = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchDashboardMetrics();
        if (isMounted) {
          setMetrics(response);
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

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalSales = metrics?.totals?.sales ?? 0;
  const salesTrend = metrics?.totals?.trend ?? 0;
  const newOrdersCount = metrics?.newOrders?.count ?? 0;
  const awaitingFulfilment = metrics?.newOrders?.awaitingFulfilment ?? 0;
  const topProductName = metrics?.topProduct?.name ?? "-";
  const topProductUnits = metrics?.topProduct?.unitsSold ?? 0;

  return (
    <main className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-2 text-base text-slate-500">
          Welcome back, Sarah. Here's a snapshot of your store performance
          today.
        </p>
      </header>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          We couldn't load dashboard metrics right now.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-lg">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-500">
              Total Sales
            </div>
            <div className="mt-4 text-4xl font-semibold text-emerald-700">
              {loading ? "--" : formatINR(totalSales)}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {loading
                ? "Updating..."
                : `${Math.round(salesTrend * 100)}% vs last month`}
            </p>
          </article>
          <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-500">
              New Orders
            </div>
            <div className="mt-4 text-4xl font-semibold text-slate-900">
              {loading ? "--" : newOrdersCount}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {loading
                ? "Updating..."
                : `${awaitingFulfilment} awaiting fulfilment`}
            </p>
          </article>
          <article className="rounded-2xl border border-emerald-100 bg-emerald-600/95 p-6 shadow-lg text-white">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100">
              Top Product
            </div>
            <div className="mt-4 text-2xl font-semibold">
              {loading ? "Updating..." : topProductName}
            </div>
            <p className="mt-3 text-sm text-emerald-100/80">
              {loading ? "--" : `${topProductUnits} units sold this week`}
            </p>
          </article>
        </div>
      )}
      <div className="flex flex-col gap-7 lg:flex-row">
        <RecentOrders />
        <RecentActivities />
      </div>
    </main>
  );
};

export default DashboardHome;
