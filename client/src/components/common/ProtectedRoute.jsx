import { Navigate, useLocation } from "react-router-dom";
import { getStoredAuthSession } from "../../utils/authStorage";

const defaultForbiddenRedirect = "/";
const defaultLoginRedirect = "/login";

/**
 * Protects a route by checking authentication token and optional role restrictions.
 * Falls back to local storage lookup so it stays in sync with auth session updates.
 */
const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectPath = defaultLoginRedirect,
  forbiddenPath = defaultForbiddenRedirect,
  session,
}) => {
  const location = useLocation();
  const authSession = session ?? getStoredAuthSession();
  const hasToken = Boolean(authSession?.token);

  if (!hasToken) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  const userRole = authSession?.user?.role ?? "customer";
  const hasRoleAccess =
    !Array.isArray(allowedRoles) ||
    allowedRoles.length === 0 ||
    allowedRoles.includes(userRole);

  if (!hasRoleAccess) {
    return <Navigate to={forbiddenPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
