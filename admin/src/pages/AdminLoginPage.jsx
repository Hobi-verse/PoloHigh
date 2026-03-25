import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/endpoints";
import { storeAuthSession } from "../utils/authStorage";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await api.auth.login({ mobileNumber, password });
      const token = response?.token;
      const user = response?.user;

      if (!token) {
        throw new Error("Login response did not include token.");
      }

      if (user?.role !== "admin") {
        throw new Error("This account is not authorized for admin access.");
      }

      storeAuthSession({ token, user });
      setMessage("Login successful. Redirecting...");

      const redirectPath = location.state?.from?.pathname || "/";
      setTimeout(() => navigate(redirectPath, { replace: true }), 350);
    } catch (requestError) {
      setError(requestError?.message || "Unable to login.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="auth-card__eyebrow">Secure Access</p>
        <h2>Admin Sign In</h2>
        <input
          onChange={(event) => setMobileNumber(event.target.value)}
          placeholder="Mobile number"
          required
          value={mobileNumber}
        />
        <input
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />
        {error ? <p className="inline-message inline-message--error">{error}</p> : null}
        {message ? <p className="inline-message">{message}</p> : null}
        <button className="button button--gold" disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </main>
  );
};

export default AdminLoginPage;
