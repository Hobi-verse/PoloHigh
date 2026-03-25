const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn(
    "Razorpay keys are not configured. Payment endpoints will fail until keys are set."
  );
}

const missingKeysError = () =>
  new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");

const buildMissingClient = () => ({
  orders: {
    create: async () => {
      throw missingKeysError();
    },
    fetch: async () => {
      throw missingKeysError();
    },
    fetchPayments: async () => {
      throw missingKeysError();
    },
  },
  payments: {
    fetch: async () => {
      throw missingKeysError();
    },
    refund: async () => {
      throw missingKeysError();
    },
  },
});

const razorpayInstance =
  keyId && keySecret
    ? new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })
    : buildMissingClient();

module.exports = razorpayInstance;
