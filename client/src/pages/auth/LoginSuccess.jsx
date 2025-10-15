import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { storeAuthSession } from "../../utils/authStorage";
import { getUserProfile } from "../../api/auth";

const LoginSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (!token) {
          throw new Error("No token received");
        }

        // Get user profile with the token
        try {
          // Store token temporarily to make API call
          localStorage.setItem("authToken", token);
          
          const profileResponse = await getUserProfile();
          
          if (profileResponse?.success && profileResponse?.user) {
            // Store complete auth session
            storeAuthSession({ 
              token: token, 
              user: profileResponse.user 
            });

            // Determine redirect path based on user role
            const redirectPath = profileResponse.user.role === "admin" 
              ? "/admin/dashboard" 
              : "/";

            // Redirect to appropriate page
            navigate(redirectPath, { replace: true });
          } else {
            throw new Error("Failed to get user profile");
          }
        } catch (profileError) {
          // If profile fetch fails, still store token and redirect
          console.warn("Profile fetch failed:", profileError);
          
          // Store basic auth session
          storeAuthSession({ 
            token: token, 
            user: { id: "google-user" } 
          });
          
          // Redirect to home page
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Google login callback error:", error);
        
        // Clear any stored tokens
        localStorage.removeItem("authToken");
        
        // Redirect to login with error
        navigate("/login?error=google_callback_failed", { replace: true });
      }
    };

    handleGoogleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#07150f] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Completing Google Sign-In
        </h2>
        <p className="text-emerald-200/80">
          Please wait while we set up your account...
        </p>
      </div>
    </div>
  );
};

export default LoginSuccess;