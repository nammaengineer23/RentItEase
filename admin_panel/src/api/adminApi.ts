import { apiRequest } from "./http";

export interface AdminDashboard {
  users: {
    totalUsers: number;
    totalOwners: number;
    totalAdmins: number;
  };
  properties: {
    totalProperties: number;
    activeProperties: number;
    rentedProperties: number;
  };
  engagement: {
    totalReviews: number;
    totalFavorites: number;
  };
  visits: {
    totalVisits: number;
    pendingVisits: number;
    approvedVisits: number;
    completedVisits: number;
  };
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: "USER" | "OWNER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  totalProperties: number;
}

export interface AdminUserDetails extends AdminUser {
  updatedAt?: string;
  properties?: Array<{
    id: string;
    title: string;
    city: string;
    locality?: string | null;
    price: number;
    isAvailable: boolean;
    createdAt: string;
  }>;
  favorites?: Array<{
    id: string;
    propertyId: string;
    createdAt: string;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    propertyId: string;
    createdAt: string;
  }>;
  visits?: Array<{
    id: string;
    propertyId: string;
    status: string;
    visitDate: string;
    createdAt: string;
  }>;
}

interface ApiDataResponse<T> {
  data?: T;
}

function unwrapData<T>(response: T | ApiDataResponse<T>): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    return (response as ApiDataResponse<T>).data as T;
  }

  return response as T;
}

export async function getDashboard(): Promise<AdminDashboard> {
  const response = await apiRequest<
    AdminDashboard | ApiDataResponse<AdminDashboard>
  >("/admin/dashboard");

  return unwrapData(response);
}

export interface AdminAnalytics {
  users: {
    total: number;
    owners: number;
    tenants: number;
    admins: number;
    active: number;
    inactive: number;
  };
  properties: {
    total: number;
    available: number;
    rented: number;
  };
  engagement: {
    reviews: number;
    favorites: number;
    visits: number;
  };
}

export async function getUsers(): Promise<AdminUser[]> {
  const response = await apiRequest<AdminUser[] | ApiDataResponse<AdminUser[]>>(
    "/admin/users",
  );

  return unwrapData(response);
}

export async function getUser(id: string): Promise<AdminUserDetails> {
  const response = await apiRequest<
    AdminUserDetails | ApiDataResponse<AdminUserDetails>
  >(`/admin/users/${id}`);

  return unwrapData(response);
}

export async function activateUser(id: string): Promise<AdminUser> {
  const response = await apiRequest<AdminUser | ApiDataResponse<AdminUser>>(
    `/admin/users/${id}/activate`,
    {
      method: "PATCH",
    },
  );

  return unwrapData(response);
}

export async function deactivateUser(id: string): Promise<AdminUser> {
  const response = await apiRequest<AdminUser | ApiDataResponse<AdminUser>>(
    `/admin/users/${id}/deactivate`,
    {
      method: "PATCH",
    },
  );

  return unwrapData(response);
}

export async function deleteUser(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<
    | { success: boolean; message: string }
    | ApiDataResponse<{ success: boolean; message: string }>
  >(`/admin/users/${id}`, {
    method: "DELETE",
  });

  return unwrapData(response);
}

export async function getAnalytics(): Promise<AdminAnalytics> {
  const response = await apiRequest<
    AdminAnalytics | ApiDataResponse<AdminAnalytics>
  >("/admin/analytics");

  return unwrapData(response);
}
