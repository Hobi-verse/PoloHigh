import { apiRequest } from "./client";

const STATUS_LABELS = {
  pending: "Processing",
  confirmed: "Processing",
  processing: "Processing",
  packed: "Processing",
  shipped: "Out for delivery",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const toStatusLabel = (value) => {
  if (!value) {
    return "Processing";
  }

  const normalized = value.toString().toLowerCase();
  if (STATUS_LABELS[normalized]) {
    return STATUS_LABELS[normalized];
  }

  return value
    .toString()
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const fallbackId = () => `device-${Math.random().toString(36).slice(2, 11)}`;

const normalizeTrustedDevices = (devices) =>
  Array.isArray(devices)
    ? devices.map((device) => ({
      id: device.deviceId ?? device._id ?? device.id ?? fallbackId(),
      device:
        device.deviceName ?? device.device ?? device.name ?? "Trusted device",
      location: device.location ?? "—",
      lastActive: device.lastActive ?? null,
      trusted: Boolean(device.trusted ?? true),
    }))
    : [];

const pickLatestTicket = (support) => {
  if (!support || typeof support !== "object") {
    return null;
  }

  const tickets = Array.isArray(support.tickets) ? support.tickets : [];
  if (!tickets.length) {
    return null;
  }

  const latest = tickets
    .slice()
    .sort((a, b) =>
      new Date(b.updatedAt || b.createdAt || 0) -
      new Date(a.updatedAt || a.createdAt || 0)
    )[0];

  return {
    id: latest.ticketId ?? latest.id,
    subject: latest.subject,
    status: toStatusLabel(latest.status),
    updatedOn: latest.updatedAt ?? latest.createdAt ?? null,
  };
};

const normalizeAccountSummary = (response) => {
  const summary = response?.data ?? response ?? null;
  if (!summary) {
    return null;
  }

  const recentOrders = Array.isArray(summary.recentOrders)
    ? summary.recentOrders.map((order) => ({
      id: order.id ?? order.orderNumber ?? order._id,
      placedOn: order.placedOn ?? order.placedAt ?? null,
      status: toStatusLabel(order.status),
      total: order.total ?? order.pricing?.grandTotal ?? 0,
      items: order.items ?? order.orderItems ?? 0,
      expectedDelivery:
        order.expectedDelivery ?? order.delivery?.estimatedDeliveryDate ?? null,
      deliveredOn:
        order.deliveredOn ?? order.delivery?.actualDeliveryDate ?? null,
      paymentMethod:
        order.paymentMethod ?? order.payment?.method ?? "Online payment",
    }))
    : [];

  const security = summary.security
    ? {
      ...summary.security,
      trustedDevices: normalizeTrustedDevices(summary.security.trustedDevices),
    }
    : null;

  const support = summary.support
    ? {
      ...summary.support,
      lastTicket: pickLatestTicket(summary.support) ?? undefined,
    }
    : null;

  const profile = summary.profile
    ? {
      ...summary.profile,
      birthday: summary.profile.birthday ?? null,
      avatar: summary.profile.avatar ?? null,
    }
    : null;

  return {
    ...summary,
    profile,
    recentOrders,
    addresses: Array.isArray(summary.addresses) ? summary.addresses : [],
    paymentMethods: Array.isArray(summary.paymentMethods)
      ? summary.paymentMethods
      : [],
    security,
    support,
    preferences: summary.preferences ?? {},
  };
};

export const fetchAccountSummary = async ({ signal } = {}) => {
  const response = await apiRequest("/profile/summary", { signal });
  return normalizeAccountSummary(response);
};

export const updateAccountPreferences = async (preferences) =>
  apiRequest("/profile/preferences", {
    method: "PATCH",
    body: preferences,
  }).then((response) => response?.data?.preferences ?? preferences);

export const updateAccountProfile = async (profile) =>
  apiRequest("/profile", {
    method: "PUT",
    body: profile,
  }).then((response) => response?.data?.profile ?? null);
