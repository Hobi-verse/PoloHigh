<<<<<<< HEAD
const DEFAULT_API_BASE_URL = "http://localhost:4000/api";
=======
const DEFAULT_API_BASE_URL ="http://localhost:4000/api";
>>>>>>> 83bf5f5e59d0c9d64fe8e603a208d752c0aeb7e5
export const API_BASE_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : DEFAULT_API_BASE_URL;
