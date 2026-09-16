import { apiRequest } from './http';
import type { Membership, MembershipStatus } from './billingApi';

export interface PremiumPlanConfig {
  id: string;
  name: string;
  code: 'FREE' | 'PREMIUM';
  description?: string | null;
  price: number | string;
  durationDays: number;
  trialDays: number;
  features: string[];
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanInput {
  name: string;
  code: 'FREE' | 'PREMIUM';
  description?: string;
  price: number;
  durationDays: number;
  trialDays: number;
  features: string[];
  displayOrder: number;
  isActive: boolean;
}

function unwrap<T>(value: T | { data?: T }): T {
  if (value && typeof value === 'object' && 'data' in value) return (value as { data?: T }).data as T;
  return value as T;
}

export async function getPremiumPlanConfigs() {
  return unwrap(await apiRequest<PremiumPlanConfig[] | { data?: PremiumPlanConfig[] }>('/admin/billing/plan-config'));
}
export async function createPremiumPlanConfig(body: PlanInput) {
  return unwrap(await apiRequest<PremiumPlanConfig | { data?: PremiumPlanConfig }>('/admin/billing/plan-config', { method: 'POST', body: JSON.stringify(body) }));
}
export async function updatePremiumPlanConfig(id: string, body: Partial<PlanInput>) {
  return unwrap(await apiRequest<PremiumPlanConfig | { data?: PremiumPlanConfig }>(`/admin/billing/plan-config/${id}`, { method: 'PATCH', body: JSON.stringify(body) }));
}
export async function getMembershipAccounts() {
  return unwrap(await apiRequest<Membership[] | { data?: Membership[] }>('/admin/billing/memberships'));
}
export async function updateMembershipAccount(id: string, body: { planId?: string; status?: MembershipStatus; extendDays?: number; notes?: string; autoRenew?: boolean }) {
  return unwrap(await apiRequest<Membership | { data?: Membership }>(`/admin/billing/memberships/${id}`, { method: 'PATCH', body: JSON.stringify(body) }));
}
export async function assignMembershipAccount(body: { userId: string; planId: string; status?: MembershipStatus; isTrial?: boolean; notes?: string }) {
  return unwrap(await apiRequest<Membership | { data?: Membership }>('/admin/billing/memberships/assign', { method: 'POST', body: JSON.stringify(body) }));
}
