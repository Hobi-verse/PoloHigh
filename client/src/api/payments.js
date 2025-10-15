import { ApiError, apiRequest } from "./client";

let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Razorpay SDK can only load in the browser"));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = null;
      script.remove();
      reject(new Error("Failed to load Razorpay SDK"));
    };
    document.head.appendChild(script);
  });

  return razorpayScriptPromise;
};

// Payment API endpoints
export const paymentAPI = {
  // Create Razorpay order
  createOrder: (orderData) =>
    apiRequest("/payments/create-order", {
      method: "POST",
      body: orderData,
    }),

  // Verify payment and create order
  verifyPayment: (paymentData) =>
    apiRequest("/payments/verify-payment", {
      method: "POST",
      body: paymentData,
    }),

  // Get payment status
  getPaymentStatus: (paymentId) => apiRequest(`/payments/status/${paymentId}`),

  // Handle payment failure
  reportPaymentFailure: (failureData) =>
    apiRequest("/payments/failure", {
      method: "POST",
      body: failureData,
    }),

  // Request refund (admin functionality)
  requestRefund: (refundData) =>
    apiRequest("/payments/refund", {
      method: "POST",
      body: refundData,
    }),
};

// Helper function to initialize Razorpay checkout
export const initializeRazorpayCheckout = async (options) => {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Razorpay SDK not loaded"));
      return;
    }

    const { modal: modalOptions, ...restOptions } = options ?? {};

    const rzp = new window.Razorpay({
      ...restOptions,
      handler: (response) => {
        resolve(response);
      },
      modal: {
        ...(modalOptions ?? {}),
        ondismiss: () => {
          if (typeof modalOptions?.ondismiss === "function") {
            modalOptions.ondismiss();
          }
          reject(new Error("Payment cancelled by user"));
        },
      },
    });

    rzp.on("payment.failed", (response) => {
      const failure = response?.error ?? new Error("Payment failed");
      reject(failure);
    });

    rzp.open();
  });
};

// Complete payment flow helper
export const processPayment = async ({
  amount,
  currency = "INR",
  shippingAddressId,
  paymentMethodId,
  couponCode,
  customerNotes,
  customerDetails,
  onSuccess,
  onFailure,
}) => {
  try {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    if (!shippingAddressId) {
      throw new Error("Shipping address is required for payment");
    }

    // Step 1: Create Razorpay order
    const orderResponse = await paymentAPI.createOrder({
      amount,
      currency,
      notes: {
        shippingAddressId,
        paymentMethodId,
        couponCode,
      },
    });

    const { success, data, message } = orderResponse ?? {};

    if (!success || !data?.orderId || !data?.key) {
      throw new Error(message || "Failed to create payment order");
    }

    const { orderId, key } = data;

    // Step 2: Initialize Razorpay checkout
    const paymentResponse = await initializeRazorpayCheckout({
      key,
      amount: amount * 100, // Convert to paise
      currency,
      name: "Ciyatake",
      description: "Order Payment",
      order_id: orderId,
      prefill: {
        name: customerDetails?.name ?? "",
        email: customerDetails?.email ?? "",
        contact: customerDetails?.phone ?? "",
      },
      theme: {
        color: "#000000", // Your brand color
      },
      notes: {
        address: "Ciyatake Corporate Office",
      },
    });

    // Step 3: Verify payment on backend
    const verificationResponse = await paymentAPI.verifyPayment({
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      shippingAddressId,
      paymentMethodId,
      couponCode,
      customerNotes,
    });

    if (verificationResponse?.success) {
      onSuccess && onSuccess(verificationResponse.data);
      return verificationResponse.data;
    }

    throw new Error(
      verificationResponse?.message || "Payment verification failed"
    );
  } catch (error) {
    // Report payment failure
    if (error.error && error.error.metadata) {
      try {
        await paymentAPI.reportPaymentFailure({
          razorpay_order_id: error.error.metadata.order_id,
          razorpay_payment_id: error.error.metadata.payment_id,
          error_description: error.error.description,
        });
      } catch (reportError) {
        console.error("Failed to report payment failure:", reportError);
      }
    }

    onFailure && onFailure(error);

    if (error instanceof ApiError) {
      throw error.payload ?? error;
    }

    throw error;
  }
};

// Format amount for display
export const formatAmount = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Validate payment form data
export const validatePaymentForm = (data) => {
  const errors = {};

  if (!data.shippingAddressId) {
    errors.shippingAddress = "Please select a shipping address";
  }

  if (!data.amount || data.amount < 1) {
    errors.amount = "Invalid payment amount";
  }

  if (data.customerNotes && data.customerNotes.length > 500) {
    errors.customerNotes = "Customer notes should be less than 500 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};