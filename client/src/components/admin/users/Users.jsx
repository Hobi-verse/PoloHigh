import { useEffect, useState } from "react";
import { fetchAdminUsers } from "../../../api/admin.js";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminUsers();
        if (isMounted) {
          setUsers(Array.isArray(response) ? response : response?.items ?? []);
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

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="space-y-7 text-slate-800">
      <header className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Admin Users</h2>
        <p className="text-base text-slate-500">
          Manage who has access to the admin console.
        </p>
      </header>
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
        <table className="min-w-full divide-y divide-emerald-50">
          <thead className="bg-emerald-600/95 text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50 text-sm">
            {error ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-6 text-center text-sm text-rose-600"
                >
                  Unable to load admin users.
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-6 text-center text-sm text-emerald-600"
                >
                  Loading users...
                </td>
              </tr>
            ) : users.length ? (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-emerald-50/60">
                  <td className="px-6 py-4 font-semibold text-emerald-700">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.role}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {user.lastActive}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-6 text-center text-sm text-slate-500"
                >
                  No admin users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Users;
