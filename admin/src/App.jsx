import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import useAuthSession from "./hooks/useAuthSession";
import { api } from "./api/endpoints";
import { clearAuthSession } from "./utils/authStorage";

const App = () => {
  const navigate = useNavigate();
  const session = useAuthSession();
  const isLoggedIn = Boolean(session?.token);
  const isAdmin = session?.user?.role === "admin";

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Clear stale client session even if logout request fails.
    } finally {
      clearAuthSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="admin-topbar__eyebrow">Polo High</p>
          <h1>Admin Console</h1>
        </div>
        {isLoggedIn ? (
          <button className="button button--outline" onClick={handleLogout} type="button">
            Logout
          </button>
        ) : null}
      </header>

      <div className="admin-content">
        <Routes>
          <Route element={<AdminLoginPage />} path="/login" />
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin"]} forbiddenPath="/login" redirectPath="/login" session={session}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
            path="/"
          />
          <Route element={<Navigate replace to={isAdmin ? "/" : "/login"} />} path="*" />
        </Routes>
      </div>
    </div>
  );
};

export default App;
