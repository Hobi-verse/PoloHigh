// const razorpay = require("../config/razorpay"); // Commented out for Stripe implementation
const stripe = require("../config/stripe");

// Format amount from rupees to cents (Stripe uses cents for USD, paise for INR)
const formatAmountToCents = (amount) => {
  return Math.round(amount * 100);
};

// Format amount from cents to rupees
const formatAmountToRupees = (amount) => {
  return amount / 100;
};

// Generate receipt ID
const generateReceiptId = (prefix = "order") => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${randomStr}`;
};

// Validate payment amount
const validatePaymentAmount = (amount, minAmount = 1, maxAmount = 1000000) => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    throw new Error("Invalid amount format");
  }
  
  if (numAmount < minAmount) {
    throw new Error(`Amount must be at least ₹${minAmount}`);
  }
  
  if (numAmount > maxAmount) {
    throw new Error(`Amount cannot exceed ₹${maxAmount}`);
  }
  
  return numAmount;
};

// Get payment method display name
const getPaymentMethodDisplayName = (method, details = {}) => {
  const methodNames = {
    card: `Card ending in ${details.last4 || "****"}`,
    upi: `UPI${details.vpa ? ` (${details.vpa})` : ""}`,
    netbanking: `Net Banking${details.bank ? ` (${details.bank})` : ""}`,
    wallet: `Wallet${details.wallet ? ` (${details.wallet})` : ""}`,
    emi: "EMI",
    paylater: "Pay Later",
  };
  
  return methodNames[method] || method;
};

// Calculate delivery charges
const calculateDeliveryCharges = (subtotal, isPremiumUser = false) => {
  if (isPremiumUser) {
    return 0; // Free delivery for premium users
  }
  
  if (subtotal >= 500) {
    return 0; // Free delivery above ₹500
  }
  
  return 50; // ₹50 delivery charge
};

// Calculate tax (GST)
const calculateTax = (amount, taxRate = 0.18) => {
  return Math.round(amount * taxRate);
};

// Validate Stripe webhook signature
const validateWebhookSignature = (body, signature, secret) => {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    return { valid: true, event };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Get payment intent status from Stripe
const getPaymentStatus = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Check if payment method is available
const isPaymentMethodAvailable = (method) => {
  const availableMethods = [
    "card",
    "netbanking", 
    "upi",
    "wallet",
    "emi",
    "paylater"
  ];
  
  return availableMethods.includes(method);
};

// Format Indian currency
const formatCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Generate order tracking number
const generateTrackingNumber = () => {
  const prefix = "CYA";
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp.slice(-6)}${random}`;
};

// Payment retry logic for Stripe
const retryPayment = async (paymentIntentId, maxRetries = 3) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === "succeeded") {
        return { success: true, paymentIntent };
      }
      
      if (paymentIntent.status === "canceled" || paymentIntent.status === "payment_failed") {
        return { success: false, error: "Payment failed permanently" };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      attempt++;
      
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        return { success: false, error: error.message };
      }
    }
  }
  
  return { success: false, error: "Max retries exceeded" };
};

module.exports = {
  formatAmountToCents,
  formatAmountToRupees,
  generateReceiptId,
  validatePaymentAmount,
  getPaymentMethodDisplayName,
  calculateDeliveryCharges,
  calculateTax,
  validateWebhookSignature,
  getPaymentStatus,
  isPaymentMethodAvailable,
  formatCurrency,
  generateTrackingNumber,
  retryPayment,
};