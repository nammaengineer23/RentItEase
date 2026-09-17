import { apiRequest } from './http';

export interface AdminSearchResult {
  type: 'USER' | 'PROPERTY' | 'REVIEW' | 'VISIT' | 'MEMBERSHIP' | 'INVOICE' | 'SOCIAL_POST';
  id: string;
  title: string;
  subtitle: string;
  path: string;
}

interface AdminSearchResponse {
  query: string;
  results: AdminSearchResult[];
}

function unwrap<T>(value: T | { data?: T }): T {
  if (value && typeof value === 'object' && 'data' in value) {
    return (value as { data?: T }).data as T;
  }
  return value as T;
}

export async function searchAdminRecords(query: string, limit = 5) {
  const response = await apiRequest<AdminSearchResponse | { data?: AdminSearchResponse }>(
    `/admin/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return unwrap(response);
}
