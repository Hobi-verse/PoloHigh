import { apiRequest } from "./client";

const normalizeAddress = (address = {}) => ({
  id: address.id ?? address._id ?? "",
  label: address.label ?? "",
  recipient: address.recipient ?? "",
  phone: address.phone ?? "",
  addressLine1: address.addressLine1 ?? "",
  addressLine2: address.addressLine2 ?? "",
  city: address.city ?? "",
  state: address.state ?? "",
  postalCode: address.postalCode ?? "",
  country: address.country ?? "",
  isDefault: Boolean(address.isDefault),
  type: address.type ?? "home",
  deliveryInstructions: address.deliveryInstructions ?? "",
  formattedAddress: address.formattedAddress ?? "",
  createdAt: address.createdAt ?? null,
  updatedAt: address.updatedAt ?? null,
});

const normalizeAddressesResponse = (response) => {
  const payload = response?.data ?? response ?? {};
  const addresses = Array.isArray(payload.addresses)
    ? payload.addresses.map((item) => normalizeAddress(item))
    : [];

  return {
    addresses,
    count: payload.count ?? addresses.length,
  };
};

export const fetchAddresses = async ({ signal } = {}) => {
  const response = await apiRequest("/addresses", { signal });
  return normalizeAddressesResponse(response);
};

export const fetchAddress = async (addressId, { signal } = {}) => {
  if (!addressId) {
    throw new Error("fetchAddress requires an id");
  }

  const response = await apiRequest(`/addresses/${addressId}`, { signal });
  const payload = response?.data ?? response ?? {};
  return normalizeAddress(payload.address ?? payload);
};

export const createAddress = async (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("createAddress requires a payload object");
  }

  const response = await apiRequest("/addresses", {
    method: "POST",
    body: payload,
  });

  const data = response?.data ?? response ?? {};
  return normalizeAddress(data.address ?? data);
};

export const updateAddress = async (addressId, payload) => {
  if (!addressId) {
    throw new Error("updateAddress requires an id");
  }

  const response = await apiRequest(`/addresses/${addressId}`, {
    method: "PUT",
    body: payload,
  });

  const data = response?.data ?? response ?? {};
  return normalizeAddress(data.address ?? data);
};

export const deleteAddress = async (addressId) => {
  if (!addressId) {
    throw new Error("deleteAddress requires an id");
  }

  return apiRequest(`/addresses/${addressId}`, {
    method: "DELETE",
  });
};

export const setDefaultAddress = async (addressId) => {
  if (!addressId) {
    throw new Error("setDefaultAddress requires an id");
  }

  const response = await apiRequest(`/addresses/${addressId}/set-default`, {
    method: "PATCH",
  });

  const data = response?.data ?? response ?? {};
  return normalizeAddress(data.address ?? data);
};

export const validatePinCode = async ({ postalCode }) => {
  if (!postalCode) {
    throw new Error("validatePinCode requires a postalCode");
  }

  const response = await apiRequest("/addresses/validate-pincode", {
    method: "POST",
    body: { postalCode },
  });

  const data = response?.data ?? response ?? {};
  return {
    valid: Boolean(data.valid ?? data.isValid ?? data.success ?? false),
    message: data.message ?? "",
    serviceable: Boolean(data.serviceable ?? data.isServiceable ?? true),
  };
};
