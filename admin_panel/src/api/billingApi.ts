import { apiRequest } from "./http";

export type MembershipPlanCode = "FREE" | "PREMIUM";
export type MembershipStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
export type PremiumListingStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
export type PaymentStatus = "CREATED" | "SUCCESS" | "FAILED" | "REFUNDED";
export type InvoiceStatus = "GENERATED" | "PAID" | "CANCELLED";

export interface MembershipPlan {
  id: string;
  name: string;
  code: MembershipPlanCode;
  description?: string | null;
  price: number | string;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  planId: string;
  status: MembershipStatus;
  startDate?: string | null;
  endDate?: string | null;
  activatedAt?: string | null;
  expiredAt?: string | null;
  cancelledAt?: string | null;
  autoRenew: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; fullName: string; email: string; phone?: string | null };
  plan?: MembershipPlan;
}

export interface PremiumListing {
  id: string;
  propertyId: string;
  userId: string;
  membershipId?: string | null;
  membershipPlanId?: string | null;
  status: PremiumListingStatus;
  startDate?: string | null;
  endDate?: string | null;
  activatedAt?: string | null;
  expiredAt?: string | null;
  cancelledAt?: string | null;
  durationDays: number;
  amount: number | string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  property?: { id: string; title: string; city: string; locality?: string | null };
  user?: { id: string; fullName: string; email: string };
  membership?: { id: string; status: string; plan?: MembershipPlan };
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  paymentId?: string | null;
  amount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  currency: string;
  status: InvoiceStatus;
  description?: string | null;
  dueDate?: string | null;
  invoiceDate: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; fullName: string; email: string; phone?: string | null };
}

export interface BillingOverview {
  plans: number;
  activePlans: number;
  memberships: number;
  activeMemberships: number;
  premiumListings: number;
  activePremiumListings: number;
  payments: number;
  successfulPayments: number;
  invoices: number;
  paidInvoices: number;
  revenue: number;
}

interface Wrapped<T> {
  data?: T;
}

function unwrap<T>(response: T | Wrapped<T>): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    return (response as Wrapped<T>).data as T;
  }
  return response as T;
}

export async function getBillingOverview() {
  return unwrap(
    await apiRequest<BillingOverview | Wrapped<BillingOverview>>(
      "/admin/billing/overview",
    ),
  );
}

export async function getBillingPlans(includeInactive = true) {
  return unwrap(
    await apiRequest<MembershipPlan[] | Wrapped<MembershipPlan[]>>(
      `/admin/billing/plans?includeInactive=${includeInactive}`,
    ),
  );
}

export async function createBillingPlan(body: {
  name: string;
  code: MembershipPlanCode;
  description?: string;
  price: number;
  durationDays: number;
}) {
  return unwrap(
    await apiRequest<MembershipPlan | Wrapped<MembershipPlan>>(
      "/admin/billing/plans",
      { method: "POST", body: JSON.stringify(body) },
    ),
  );
}

export async function updateBillingPlan(
  id: string,
  body: Partial<{
    name: string;
    code: MembershipPlanCode;
    description: string;
    price: number;
    durationDays: number;
    isActive: boolean;
  }>,
) {
  return unwrap(
    await apiRequest<MembershipPlan | Wrapped<MembershipPlan>>(
      `/admin/billing/plans/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  );
}

export async function deactivateBillingPlan(id: string) {
  return unwrap(
    await apiRequest<MembershipPlan | Wrapped<MembershipPlan>>(
      `/admin/billing/plans/${id}/deactivate`,
      { method: "PATCH" },
    ),
  );
}

export async function getAdminMemberships() {
  return unwrap(
    await apiRequest<Membership[] | Wrapped<Membership[]>>(
      "/admin/billing/memberships",
    ),
  );
}

export async function activateAdminMembership(id: string) {
  return unwrap(
    await apiRequest<Membership | Wrapped<Membership>>(
      `/admin/billing/memberships/${id}/activate`,
      { method: "PATCH" },
    ),
  );
}

export async function cancelAdminMembership(id: string) {
  return unwrap(
    await apiRequest<Membership | Wrapped<Membership>>(
      `/admin/billing/memberships/${id}/cancel`,
      { method: "PATCH" },
    ),
  );
}

export async function expireAdminMembership(id: string) {
  return unwrap(
    await apiRequest<Membership | Wrapped<Membership>>(
      `/admin/billing/memberships/${id}/expire`,
      { method: "PATCH" },
    ),
  );
}

export async function renewAdminMembership(id: string) {
  return unwrap(
    await apiRequest<Membership | Wrapped<Membership>>(
      `/admin/billing/memberships/${id}/renew`,
      { method: "PATCH" },
    ),
  );
}

export async function getAdminPremiumListings() {
  return unwrap(
    await apiRequest<PremiumListing[] | Wrapped<PremiumListing[]>>(
      "/admin/billing/premium-listings",
    ),
  );
}

export async function activateAdminPremiumListing(id: string) {
  return unwrap(
    await apiRequest<PremiumListing | Wrapped<PremiumListing>>(
      `/admin/billing/premium-listings/${id}/activate`,
      { method: "PATCH" },
    ),
  );
}

export async function cancelAdminPremiumListing(id: string) {
  return unwrap(
    await apiRequest<PremiumListing | Wrapped<PremiumListing>>(
      `/admin/billing/premium-listings/${id}/cancel`,
      { method: "PATCH" },
    ),
  );
}

export async function expireAdminPremiumListing(id: string) {
  return unwrap(
    await apiRequest<PremiumListing | Wrapped<PremiumListing>>(
      `/admin/billing/premium-listings/${id}/expire`,
      { method: "PATCH" },
    ),
  );
}

export async function getAdminPayments() {
  return unwrap(
    await apiRequest<Payment[] | Wrapped<Payment[]>>(
      "/admin/billing/payments",
    ),
  );
}

export async function getAdminInvoices() {
  return unwrap(
    await apiRequest<Invoice[] | Wrapped<Invoice[]>>(
      "/admin/billing/invoices",
    ),
  );
}

export async function markAdminInvoicePaid(id: string) {
  return unwrap(
    await apiRequest<Invoice | Wrapped<Invoice>>(
      `/admin/billing/invoices/${id}/paid`,
      { method: "PATCH" },
    ),
  );
}

export async function cancelAdminInvoice(id: string) {
  return unwrap(
    await apiRequest<Invoice | Wrapped<Invoice>>(
      `/admin/billing/invoices/${id}/cancel`,
      { method: "PATCH" },
    ),
  );
}
