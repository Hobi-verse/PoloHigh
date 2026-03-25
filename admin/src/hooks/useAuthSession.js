import { useEffect, useState } from "react";
import {
  AUTH_SESSION_EVENT,
  AUTH_STORAGE_KEYS,
  getStoredAuthSession,
} from "../utils/authStorage";

const isRelevantStorageKey = (key) =>
  key === AUTH_STORAGE_KEYS.token ||
  key === AUTH_STORAGE_KEYS.user ||
  key === null;

export const useAuthSession = () => {
  const [session, setSession] = useState(() => getStoredAuthSession());

  useEffect(() => {
    const handleAuthSessionChange = (event) => {
      const detail = event?.detail ?? {};
      setSession({
        token: detail.token ?? null,
        user: detail.user ?? null,
      });
    };

    const handleStorage = (event) => {
      if (!isRelevantStorageKey(event?.key)) {
        return;
      }
      setSession(getStoredAuthSession());
    };

    window.addEventListener(AUTH_SESSION_EVENT, handleAuthSessionChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, handleAuthSessionChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return session;
};

export default useAuthSession;
