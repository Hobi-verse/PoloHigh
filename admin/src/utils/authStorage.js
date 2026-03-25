const AUTH_TOKEN_STORAGE_KEY = "ciyatake.auth.token";
const AUTH_USER_STORAGE_KEY = "ciyatake.auth.user";
export const AUTH_SESSION_EVENT = "auth:session-changed";

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const safeParse = (value) => {
  if (typeof value !== "string" || !value.length) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse stored auth user", error);
    return null;
  }
};

const dispatchAuthSessionEvent = ({ token = null, user = null } = {}) => {
  if (!isBrowser || typeof window.dispatchEvent !== "function") {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent(AUTH_SESSION_EVENT, {
        detail: { token, user },
      })
    );
  } catch (error) {
    console.warn("Failed to dispatch auth session event", error);
  }
};

export const storeAuthSession = ({ token, user } = {}) => {
  if (!isBrowser) {
    return;
  }

  const currentSession = getStoredAuthSession();
  const nextSession = {
    token: currentSession.token,
    user: currentSession.user,
  };

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    nextSession.token = token;
  }

  if (user) {
    try {
      window.localStorage.setItem(
        AUTH_USER_STORAGE_KEY,
        typeof user === "string" ? user : JSON.stringify(user)
      );
      nextSession.user = user;
    } catch (error) {
      console.warn("Unable to persist auth user", error);
    }
  }

  dispatchAuthSessionEvent(nextSession);
};

export const clearAuthSession = () => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to remove stored auth token", error);
  }

  try {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to remove stored auth user", error);
  }

  dispatchAuthSessionEvent({ token: null, user: null });
};

export const getAuthToken = () => {
  if (!isBrowser) {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
};

export const getStoredAuthUser = () => {
  if (!isBrowser) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  return safeParse(raw);
};

export const getStoredAuthSession = () => ({
  token: getAuthToken(),
  user: getStoredAuthUser(),
});

export const AUTH_STORAGE_KEYS = {
  token: AUTH_TOKEN_STORAGE_KEY,
  user: AUTH_USER_STORAGE_KEY,
};
