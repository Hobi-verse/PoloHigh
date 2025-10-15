import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../../components/user/common/UserNavbar";
import AuthForm from "../../components/common/AuthForm";
import Button from "../../components/common/Button";
import { sendOtp, verifyOtp, registerUser } from "../../api/auth";
import { storeAuthSession } from "../../utils/authStorage";

const OTP_LENGTH = 6;

const Register = () => {
  const navigate = useNavigate();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpMobileNumber, setOtpMobileNumber] = useState("");
  const [otpFeedback, setOtpFeedback] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const extractErrorMessage = useCallback(
    (error, fallback = "Something went wrong. Please try again.") => {
      if (!error) {
        return fallback;
      }

      const payload = error.payload ?? error.response ?? null;

      if (payload) {
        if (typeof payload === "string" && payload.length) {
          return payload;
        }
        if (typeof payload.message === "string" && payload.message.length) {
          return payload.message;
        }
      }

      if (typeof error.message === "string" && error.message.length) {
        return error.message;
      }

      return fallback;
    },
    []
  );

  const handleSendOtp = useCallback(
    async (phoneNumber, resetOtp) => {
      const sanitized = (phoneNumber ?? "").replace(/[^0-9]/g, "").slice(0, 10);

      if (!sanitized || sanitized.length !== 10) {
        setOtpFeedback({
          type: "error",
          message:
            "Enter a valid 10-digit mobile number before requesting an OTP.",
        });
        return;
      }

      setIsSendingOtp(true);
      setOtpFeedback(null);
      setStatus(null);

      try {
        const response = await sendOtp({
          mobileNumber: sanitized,
          context: "register",
        });

        setIsOtpSent(true);
        setIsOtpVerified(false);
        setOtpMobileNumber(sanitized);
        resetOtp?.();

        setOtpFeedback({
          type: "info",
          message: `${response?.message ?? "OTP sent successfully."}${
            response?.otp ? ` (For testing use ${response.otp})` : ""
          }`,
        });
      } catch (error) {
        setOtpFeedback({
          type: "error",
          message: extractErrorMessage(
            error,
            "Failed to send OTP. Please try again."
          ),
        });
      } finally {
        setIsSendingOtp(false);
      }
    },
    [extractErrorMessage]
  );

  const handleVerifyOtp = useCallback(
    async (phoneNumber, enteredOtp) => {
      if (!isOtpSent) {
        setOtpFeedback({
          type: "error",
          message: "Request an OTP before attempting verification.",
        });
        return;
      }

      const sanitizedNumber = (phoneNumber ?? "")
        .replace(/[^0-9]/g, "")
        .slice(0, 10);

      if (!sanitizedNumber || sanitizedNumber.length !== 10) {
        setOtpFeedback({
          type: "error",
          message: "Enter the mobile number used to request the OTP.",
        });
        return;
      }

      if (otpMobileNumber && sanitizedNumber !== otpMobileNumber) {
        setOtpFeedback({
          type: "error",
          message:
            "Mobile number changed. Please request a new OTP for this number.",
        });
        setIsOtpVerified(false);
        return;
      }

      const sanitizedOtp = (enteredOtp ?? "")
        .replace(/[^0-9]/g, "")
        .slice(0, OTP_LENGTH);

      if (!sanitizedOtp || sanitizedOtp.length !== OTP_LENGTH) {
        setOtpFeedback({
          type: "error",
          message: "Enter the 6-digit OTP that was sent to your mobile number.",
        });
        return;
      }

      setIsVerifyingOtp(true);
      setOtpFeedback(null);
      setStatus(null);

      try {
        const response = await verifyOtp({
          mobileNumber: sanitizedNumber,
          otp: sanitizedOtp,
        });

        setIsOtpVerified(true);
        setOtpFeedback({
          type: "success",
          message:
            response?.message ??
            "OTP verified successfully. You can now create your password.",
        });
      } catch (error) {
        setIsOtpVerified(false);
        setOtpFeedback({
          type: "error",
          message: extractErrorMessage(
            error,
            "Failed to verify OTP. Please try again."
          ),
        });
      } finally {
        setIsVerifyingOtp(false);
      }
    },
    [extractErrorMessage, isOtpSent, otpMobileNumber]
  );

  const buttonLabel = isSubmitting ? "Creating account..." : "Register";

  const fields = [
    {
      name: "phoneNumber",
      render: ({
        value = "",
        setValue,
        formData,
        setFieldValue,
        inputClasses,
      }) => {
        const phoneId = "register-phone-input";
        const otpId = "register-otp-input";

        const handlePhoneChange = (event) => {
          const nextValue = event.target.value
            .replace(/[^0-9]/g, "")
            .slice(0, 10);
          setValue(nextValue);

          setStatus(null);

          if (isOtpSent || isOtpVerified) {
            if (nextValue !== otpMobileNumber) {
              setIsOtpSent(false);
              setIsOtpVerified(false);
              setOtpMobileNumber("");
              setFieldValue("otp", "");
            }
          }

          if (otpFeedback) {
            setOtpFeedback(null);
          }
        };

        const handleOtpChange = (event) => {
          const nextValue = event.target.value
            .replace(/[^0-9]/g, "")
            .slice(0, OTP_LENGTH);
          setFieldValue("otp", nextValue);
          setOtpFeedback(null);
          if (isOtpVerified) {
            setIsOtpVerified(false);
          }
        };

        return (
          <div className="space-y-2">
            <label
              htmlFor={phoneId}
              className="block text-sm font-medium text-emerald-100"
            >
              Mobile number & OTP
            </label>
            <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
              <div className="space-y-2">
                <input
                  id={phoneId}
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  className={inputClasses}
                  placeholder="Enter the mobile number"
                  value={value}
                  onChange={handlePhoneChange}
                  required
                />
                <Button
                  type="button"
                  className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                  onClick={() =>
                    handleSendOtp(value, () => setFieldValue("otp", ""))
                  }
                  disabled={value.length !== 10 || isSendingOtp}
                >
                  {isSendingOtp
                    ? "Sending..."
                    : isOtpSent
                    ? "Resend OTP"
                    : "Send OTP"}
                </Button>
              </div>
              <div className="space-y-2">
                <input
                  id={otpId}
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`${inputClasses} disabled:opacity-60`}
                  placeholder="Enter OTP"
                  value={formData.otp ?? ""}
                  onChange={handleOtpChange}
                  disabled={!isOtpSent}
                  maxLength={OTP_LENGTH}
                />
                <Button
                  type="button"
                  className="w-full border border-emerald-300/60 bg-transparent text-emerald-100 hover:bg-emerald-400/10 disabled:opacity-60"
                  onClick={() => handleVerifyOtp(value, formData.otp ?? "")}
                  disabled={
                    !isOtpSent ||
                    (formData.otp ?? "").length !== OTP_LENGTH ||
                    isVerifyingOtp ||
                    isOtpVerified
                  }
                >
                  {isVerifyingOtp
                    ? "Verifying..."
                    : isOtpVerified
                    ? "OTP Verified"
                    : "Verify OTP"}
                </Button>
              </div>
            </div>
            {otpFeedback ? (
              <p
                className={`text-sm ${
                  otpFeedback.type === "error"
                    ? "text-red-400"
                    : otpFeedback.type === "success"
                    ? "text-emerald-300"
                    : "text-emerald-200/80"
                }`}
              >
                {otpFeedback.message}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      name: "password",
      type: "password",
      placeholder: "Enter the Password",
      required: true,
      disabled: !isOtpVerified,
      autoComplete: "new-password",
    },
    {
      name: "confirmPassword",
      type: "password",
      placeholder: "Confirm Password",
      required: true,
      disabled: !isOtpVerified,
      autoComplete: "new-password",
    },
    {
      name: "otp",
      hidden: true,
      defaultValue: "",
    },
  ];

  const socialProviders = [
    { label: "Google", onClick: () => alert("Register with Google") },
  ];

  const handleSubmit = useCallback(
    async (formValues, { reset }) => {
      if (!isOtpVerified) {
        setOtpFeedback({
          type: "error",
          message: "Please verify the OTP before creating your account.",
        });
        return;
      }

      const mobileNumber = (formValues.phoneNumber ?? "")
        .replace(/[^0-9]/g, "")
        .slice(0, 10);

      if (!mobileNumber || mobileNumber.length !== 10) {
        setOtpFeedback({
          type: "error",
          message: "Enter the mobile number you verified with OTP.",
        });
        return;
      }

      if (otpMobileNumber && otpMobileNumber !== mobileNumber) {
        setOtpFeedback({
          type: "error",
          message:
            "Mobile number no longer matches the verified OTP. Please request a new OTP.",
        });
        setIsOtpVerified(false);
        return;
      }

      if (formValues.password !== formValues.confirmPassword) {
        setOtpFeedback({
          type: "error",
          message: "Passwords do not match. Please re-enter them.",
        });
        return;
      }

      setIsSubmitting(true);
      setStatus(null);

      try {
        const response = await registerUser({
          mobileNumber,
          password: formValues.password,
          confirmPassword: formValues.confirmPassword,
        });

        if (!response?.success) {
          throw new Error(response?.message ?? "Failed to create account");
        }

        storeAuthSession({ token: response.token, user: response.user });

        setStatus({
          type: "success",
          message:
            response?.message ??
            "Account created successfully! Redirecting to home...",
        });

        reset?.();
        setIsOtpSent(false);
        setIsOtpVerified(false);
        setOtpMobileNumber("");
        setOtpFeedback(null);

        setTimeout(() => navigate("/"), 700);
      } catch (error) {
        setStatus({
          type: "error",
          message: extractErrorMessage(
            error,
            "Failed to create account. Please try again."
          ),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [extractErrorMessage, isOtpVerified, navigate, otpMobileNumber]
  );

  return (
    <div className="min-h-screen bg-[#07150f]">
      <UserNavbar />
      <AuthForm
        title="Create New Account"
        subtitle="Start your personalised shopping experience"
        fields={fields}
        onSubmit={handleSubmit}
        onFieldChange={() => {
          if (status?.type === "error") {
            setStatus(null);
          }
        }}
        socialProviders={socialProviders}
        buttonLabel={buttonLabel}
        isSubmitDisabled={!isOtpVerified || isSubmitting}
        footerText="Already have an account?"
        footerLinkText="Login"
        footerLinkHref="/login"
        status={status}
      />
    </div>
  );
};

export default Register;
