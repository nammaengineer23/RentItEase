import { describe, expect, it } from 'vitest';

import { getProtectedRouteDecision } from '../src/auth/protectedRoutePolicy';
import { getDashboardViewState } from '../src/pages/dashboardViewState';
import type { AdminDashboard } from '../src/api/adminApi';

describe('admin protected route states', () => {
  it('shows loading while the current session is being restored', () => {
    expect(getProtectedRouteDecision(true, false)).toBe('loading');
    expect(getProtectedRouteDecision(true, true)).toBe('loading');
  });

  it('redirects a signed-out user to login after loading completes', () => {
    expect(getProtectedRouteDecision(false, false)).toBe('redirect-to-login');
  });

  it('allows authenticated administrators to enter protected pages', () => {
    expect(getProtectedRouteDecision(false, true)).toBe('allow');
  });
});

describe('admin dashboard view states', () => {
  it('prioritizes loading while the request is pending', () => {
    expect(
      getDashboardViewState({ loading: true, error: '', dashboard: null }),
    ).toBe('loading');
  });

  it('shows an error state when loading fails', () => {
    expect(
      getDashboardViewState({
        loading: false,
        error: 'Network unavailable',
        dashboard: null,
      }),
    ).toBe('error');
  });

  it('shows an empty state when the request succeeds without dashboard data', () => {
    expect(
      getDashboardViewState({ loading: false, error: '', dashboard: null }),
    ).toBe('empty');
  });

  it('shows dashboard content when data is available', () => {
    const dashboard = {} as AdminDashboard;
    expect(
      getDashboardViewState({ loading: false, error: '', dashboard }),
    ).toBe('ready');
  });
});
