import { apiRequest } from "./http";

export type VisitStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export interface AdminVisit {
  id: string;
  propertyId: string;
  tenantId: string;
  visitDate: string;
  status: VisitStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  tenant: {
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

interface VisitsResponse {
  success: boolean;
  timestamp?: string;
  data: AdminVisit[];
}

interface VisitActionResponse {
  success: boolean;
  timestamp?: string;
  data: AdminVisit;
}

export async function getVisits(): Promise<AdminVisit[]> {
  const response = await apiRequest<VisitsResponse>("/admin/visits");
  return response.data;
}

export async function approveVisit(id: string): Promise<AdminVisit> {
  const response = await apiRequest<VisitActionResponse>(
    `/admin/visits/${id}/approve`,
    {
      method: "PATCH",
    },
  );

  return response.data;
}

export async function rejectVisit(id: string): Promise<AdminVisit> {
  const response = await apiRequest<VisitActionResponse>(
    `/admin/visits/${id}/reject`,
    {
      method: "PATCH",
    },
  );

  return response.data;
}

export async function completeVisit(id: string): Promise<AdminVisit> {
  const response = await apiRequest<VisitActionResponse>(
    `/admin/visits/${id}/complete`,
    {
      method: "PATCH",
    },
  );

  return response.data;
}

