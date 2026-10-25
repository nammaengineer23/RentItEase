import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AuthContext';
import { getProtectedRouteDecision } from './protectedRoutePolicy';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  const decision = getProtectedRouteDecision(isLoading, isAuthenticated);

  if (decision === 'loading') {
    return <div className="page-loader">Loading admin panel…</div>;
  }

  if (decision === 'redirect-to-login') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}