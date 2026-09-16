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
  booking?: { id: string; status: string } | null;
  tenant: { id: string; fullName: string; email: string };
  property: {
    id: string;
    title: string;
    city: string;
    locality?: string | null;
    owner?: { id: string; fullName: string; email: string };
  };
}

interface VisitsResponse { success: boolean; timestamp?: string; data: AdminVisit[]; }
interface VisitActionResponse { success: boolean; timestamp?: string; data: AdminVisit; }

export async function getVisits(): Promise<AdminVisit[]> {
  const response = await apiRequest<VisitsResponse>("/admin/visits");
  return response.data;
}

async function visitAction(id: string, action: string): Promise<AdminVisit> {
  const response = await apiRequest<VisitActionResponse>(`/admin/visits/${id}/${action}`, { method: "PATCH" });
  return response.data;
}

export const approveVisit = (id: string) => visitAction(id, "approve");
export const rejectVisit = (id: string) => visitAction(id, "reject");
export const completeVisit = (id: string) => visitAction(id, "complete");
export const cancelVisit = (id: string) => visitAction(id, "cancel");
