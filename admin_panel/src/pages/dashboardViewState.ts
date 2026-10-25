import type { AdminDashboard } from '../api/adminApi';

export type DashboardViewState = 'loading' | 'error' | 'empty' | 'ready';

export function getDashboardViewState(input: {
  loading: boolean;
  error: string;
  dashboard: AdminDashboard | null;
}): DashboardViewState {
  if (input.loading) return 'loading';
  if (input.error) return 'error';
  if (!input.dashboard) return 'empty';
  return 'ready';
}
