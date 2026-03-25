const DEFAULT_API_BASE_URL = "http://localhost:4000/api";

const resolveBaseUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return DEFAULT_API_BASE_URL;
};

export const API_BASE_URL = resolveBaseUrl().replace(/\/$/, "");
