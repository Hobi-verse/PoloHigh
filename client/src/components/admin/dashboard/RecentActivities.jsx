import { useEffect, useState } from "react";
import { fetchRecentActivities } from "../../../api/admin.js";

const RecentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchRecentActivities();
        if (isMounted) {
          setActivities(
            Array.isArray(response) ? response : response?.items ?? []
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

    loadActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-emerald-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Recent Activity
        </h3>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
          Feed
        </span>
      </header>
      <div className="space-y-5 px-6 py-5 text-sm text-slate-600">
        {error ? (
          <p className="rounded-2xl bg-rose-50 p-4 text-center text-sm text-rose-600">
            Unable to load activity feed.
          </p>
        ) : loading ? (
          <p className="rounded-2xl bg-emerald-50 p-4 text-center text-sm text-emerald-700">
            Loading activity...
          </p>
        ) : activities.length ? (
          activities.map((activity, index) => (
            <div
              key={`${activity.message}-${index}`}
              className="flex items-start gap-3"
            >
              <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                {activity.icon ?? "📝"}
              </span>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{activity.message}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-white/80 p-4 text-center text-sm text-slate-500">
            No activity yet.
          </p>
        )}
      </div>
      <div className="border-t border-emerald-100 p-6">
        <button className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
          View all activity
        </button>
      </div>
    </aside>
  );
};

export default RecentActivities;
