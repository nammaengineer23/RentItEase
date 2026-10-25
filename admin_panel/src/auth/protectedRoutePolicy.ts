export type ProtectedRouteDecision = 'loading' | 'redirect-to-login' | 'allow';

export function getProtectedRouteDecision(
  isLoading: boolean,
  isAuthenticated: boolean,
): ProtectedRouteDecision {
  if (isLoading) return 'loading';
  if (!isAuthenticated) return 'redirect-to-login';
  return 'allow';
}
