import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/authStorage";

export class ApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const buildQueryString = (query) => {
  if (!query || typeof query !== "object") {
    return "";
  }

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
      return;
    }

    searchParams.append(key, value);
  });

  const serialized = searchParams.toString();
  return serialized.length ? `?${serialized}` : "";
};

export const apiRequest = async (
  path,
  { method = "GET", headers, body, query, signal } = {}
) => {
  if (typeof path !== "string" || !path.length) {
    throw new Error("apiRequest requires a path string");
  }

  const endpoint = path.startsWith("http")
    ? path
    : `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const requestHeaders = {
    ...(headers ?? {}),
  };

  const requestInit = {
    method,
    headers: requestHeaders,
    signal,
  };

  const token = getAuthToken();
  if (token && !requestInit.headers.Authorization) {
    requestInit.headers.Authorization = `Bearer ${token}`;
  }

  const hasBody = body !== undefined && body !== null;
  const isFormDataBody =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (hasBody) {
    if (!isFormDataBody) {
      if (
        !requestHeaders["Content-Type"] &&
        !requestHeaders["content-type"]
      ) {
        requestHeaders["Content-Type"] = "application/json";
      }

      requestInit.body =
        typeof body === "string" ? body : JSON.stringify(body);
    } else {
      requestInit.body = body;
    }
  } else if (
    method &&
    method !== "GET" &&
    method !== "HEAD" &&
    !requestHeaders["Content-Type"] &&
    !requestHeaders["content-type"]
  ) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const queryString = buildQueryString(query);

  const response = await fetch(`${endpoint}${queryString}`, requestInit);

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError("Request failed", {
      status: response.status,
      payload,
    });
  }

  return payload;
};

