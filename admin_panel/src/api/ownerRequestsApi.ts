import { apiRequest } from "./http";

export interface OwnerRequest {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  ownerRequestStatus: "PENDING";
  ownerRequestedAt?: string | null;
}

interface OwnerRequestsResponse {
  data: OwnerRequest[];
}

export async function getOwnerRequests(): Promise<OwnerRequest[]> {
  const response = await apiRequest<OwnerRequestsResponse>("/users/owner-requests");
  return response.data;
}

export async function decideOwnerRequest(id: string, approve: boolean): Promise<void> {
  await apiRequest(`/users/${id}/owner-request/${approve ? "approve" : "reject"}`, {
    method: "PATCH",
  });
}
