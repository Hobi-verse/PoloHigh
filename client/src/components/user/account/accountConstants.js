export const accountSections = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders & returns" },
  { id: "addresses", label: "Addresses" },
  { id: "payments", label: "Payments & wallet" },
  { id: "reviews", label: "My reviews" },
  { id: "preferences", label: "Security & preferences" },
];

export const orderStatusStyles = {
  "Out for delivery": "bg-emerald-400/15 text-emerald-100",
  Delivered: "bg-emerald-500/15 text-emerald-100",
  Processing: "bg-amber-400/15 text-amber-100",
  Cancelled: "bg-rose-500/20 text-rose-100",
  Default: "bg-white/10 text-emerald-100",
};

export const preferenceLabels = {
  marketingEmails: "Product updates & offers",
  smsUpdates: "Shipping & delivery SMS",
  whatsappUpdates: "WhatsApp alerts",
  orderReminders: "Cart reminders",
  securityAlerts: "Security alerts",
};
