import { apiRequest } from './http';

export interface AdminReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; fullName: string; email: string };
  property: { id: string; title: string; city: string; locality?: string | null };
}

interface ReviewsResponse { success: boolean; timestamp?: string; data: AdminReview[] }
interface ReviewResponse { success?: boolean; timestamp?: string; data?: AdminReview }

export async function getReviews(): Promise<AdminReview[]> {
  const response = await apiRequest<ReviewsResponse>('/admin/reviews');
  return response.data;
}

export async function updateReview(id: string, input: { rating: number; comment: string }): Promise<AdminReview> {
  const response = await apiRequest<AdminReview | ReviewResponse>(`/admin/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if ('data' in response && response.data) return response.data;
  return response as AdminReview;
}

export async function deleteReview(id: string): Promise<void> {
  await apiRequest(`/admin/reviews/${id}`, { method: 'DELETE' });
}
