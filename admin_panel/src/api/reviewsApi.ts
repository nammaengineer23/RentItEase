import { apiRequest } from "./http";

export interface AdminReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  property: {
    id: string;
    title: string;
    city: string;
    locality?: string | null;
  };
}

interface ReviewsResponse {
  success: boolean;
  timestamp?: string;
  data: AdminReview[];
}

export async function getReviews(): Promise<AdminReview[]> {
  const response = await apiRequest<ReviewsResponse>("/admin/reviews");
  return response.data;
}

export async function deleteReview(id: string): Promise<void> {
  await apiRequest(`/admin/reviews/${id}`, {
    method: "DELETE",
  });
}

