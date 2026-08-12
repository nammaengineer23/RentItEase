import { apiRequest } from './http';

export type UserRole = 'USER' | 'OWNER' | 'ADMIN';

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  totalProperties: number;
}

export interface AdminUserDetails extends AdminUserListItem {
  updatedAt?: string;
  properties?: Array<{
    id: string;
    title: string;
    city: string;
    locality?: string | null;
    price: number | string;
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

interface UsersResponse {
  success: boolean;
  timestamp?: string;
  data: AdminUserListItem[];
}

interface UserDetailsResponse {
  success: boolean;
  timestamp?: string;
  data: AdminUserDetails;
}

interface UserActionResponse {
  success?: boolean;
  timestamp?: string;
  message?: string;
  data?: AdminUserListItem;
}

export async function getUsers(): Promise<AdminUserListItem[]> {
  const response = await apiRequest<UsersResponse>('/admin/users');
  return response.data;
}

export async function getUser(
  id: string,
): Promise<AdminUserDetails> {
  const response = await apiRequest<UserDetailsResponse>(
    `/admin/users/${id}`,
  );

  return response.data;
}

export async function activateUser(
  id: string,
): Promise<AdminUserListItem> {
  const response = await apiRequest<UserActionResponse>(
    `/admin/users/${id}/activate`,
    {
      method: 'PATCH',
    },
  );

  if (response.data) {
    return response.data;
  }

  return getUser(id);
}

export async function deactivateUser(
  id: string,
): Promise<AdminUserListItem> {
  const response = await apiRequest<UserActionResponse>(
    `/admin/users/${id}/deactivate`,
    {
      method: 'PATCH',
    },
  );

  if (response.data) {
    return response.data;
  }

  return getUser(id);
}

export async function deleteUser(
  id: string,
): Promise<void> {
  await apiRequest<UserActionResponse>(
    `/admin/users/${id}`,
    {
      method: 'DELETE',
    },
  );
}