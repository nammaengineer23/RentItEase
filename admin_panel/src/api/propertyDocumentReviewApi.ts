import { apiRequest } from "./http";

export type PropertyDocumentReviewStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export interface DocumentReviewProperty {
  id: string;
  title: string;
  transactionType: "RENT" | "LEASE" | "SALE" | "SITE_SALE";
  city: string;
  locality?: string | null;
  documentReviewStatus: PropertyDocumentReviewStatus;
  owner: { id: string; fullName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export async function getDocumentReviewQueue(): Promise<DocumentReviewProperty[]> {
  return apiRequest<DocumentReviewProperty[]>("/admin/properties/document-review");
}

export async function updateDocumentReviewStatus(
  id: string,
  status: PropertyDocumentReviewStatus,
  reason?: string,
): Promise<{ id: string; documentReviewStatus: PropertyDocumentReviewStatus }> {
  return apiRequest("/admin/properties/" + encodeURIComponent(id) + "/document-review", {
    method: "PATCH",
    body: JSON.stringify({ status, ...(reason?.trim() ? { reason: reason.trim() } : {}) }),
  });
}
