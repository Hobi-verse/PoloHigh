import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/endpoints";
import { storeAuthSession } from "../../utils/authStorage";

const SignupPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [otpVerified, setOtpVerified] = useState(false);
  const [loadingState, setLoadingState] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const patchForm = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const sendOtp = async () => {
    try {
      setLoadingState("send-otp");
      setError("");
      await api.auth.sendOtp({ mobileNumber: form.mobileNumber });
      setMessage("OTP sent to your mobile number.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to send OTP.");
    } finally {
      setLoadingState("");
    }
  };

  const verifyOtp = async () => {
    try {
      setLoadingState("verify-otp");
      setError("");
      await api.auth.verifyOtp({ mobileNumber: form.mobileNumber, otp: form.otp });
      setOtpVerified(true);
      setMessage("OTP verified. You can create your account.");
    } catch (requestError) {
      setOtpVerified(false);
      setError(requestError?.message || "Unable to verify OTP.");
    } finally {
      setLoadingState("");
    }
  };

  const signup = async (event) => {
    event.preventDefault();
    if (!otpVerified) {
      setError("Please verify OTP before signing up.");
      return;
    }

    try {
      setLoadingState("signup");
      setError("");
      setMessage("");

      const response = await api.auth.signup({
        fullName: form.fullName,
        email: form.email,
        mobileNumber: form.mobileNumber,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      const token = response?.token;
      const user = response?.user;

      if (!token) {
        throw new Error("Signup response did not include token.");
      }

      storeAuthSession({ token, user });
      setMessage("Account created successfully. Redirecting...");
      setTimeout(() => navigate("/"), 400);
    } catch (requestError) {
      setError(requestError?.message || "Unable to create account.");
    } finally {
      setLoadingState("");
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={signup}>
        <p className="auth-card__eyebrow">Create Account</p>
        <h1>Join Polo High</h1>

        <input
          name="fullName"
          onChange={(event) => patchForm("fullName", event.target.value)}
          placeholder="Full name"
          required
          value={form.fullName}
        />
        <input
          name="email"
          onChange={(event) => patchForm("email", event.target.value)}
          placeholder="Email (optional)"
          type="email"
          value={form.email}
        />
        <div className="two-col">
          <input
            name="mobileNumber"
            onChange={(event) => {
              patchForm("mobileNumber", event.target.value);
              setOtpVerified(false);
            }}
            placeholder="Mobile number"
            required
            value={form.mobileNumber}
          />
          <button className="button button--outline" disabled={loadingState !== ""} onClick={sendOtp} type="button">
            Send OTP
          </button>
        </div>
        <div className="two-col">
          <input
            name="otp"
            onChange={(event) => patchForm("otp", event.target.value)}
            placeholder="Enter OTP"
            value={form.otp}
          />
          <button
            className="button button--outline"
            disabled={loadingState !== "" || !form.otp}
            onClick={verifyOtp}
            type="button"
          >
            Verify OTP
          </button>
        </div>

        <input
          name="password"
          onChange={(event) => patchForm("password", event.target.value)}
          placeholder="Password"
          required
          type="password"
          value={form.password}
        />
        <input
          name="confirmPassword"
          onChange={(event) => patchForm("confirmPassword", event.target.value)}
          placeholder="Confirm password"
          required
          type="password"
          value={form.confirmPassword}
        />

        {otpVerified ? <p className="inline-message">OTP verified.</p> : null}
        {error ? <p className="inline-message inline-message--error">{error}</p> : null}
        {message ? <p className="inline-message">{message}</p> : null}

        <button className="button button--gold" disabled={loadingState !== ""} type="submit">
          {loadingState === "signup" ? "Creating account..." : "Create Account"}
        </button>

        <p className="auth-card__switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
};

export default SignupPage;
