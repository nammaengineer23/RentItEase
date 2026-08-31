import { apiRequest } from "./http";

export interface AdminPropertyListItem {
  id: string;
  title: string;
  city: string;
  locality?: string | null;
  price: number | string;
  owner: {
    id: string;
    fullName: string;
    email: string;
  };
  isVerified: boolean;
  isAvailable: boolean;
  totalFavorites: number;
  totalVisits: number;
  totalReviews: number;
  primaryImage?: string | null;
  createdAt: string;
}

export interface AdminPropertyDetails extends AdminPropertyListItem {
  description?: string;
  address?: string;
  state?: string;
  country?: string;
  pincode?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  propertyType?: string;
  furnishing?: string;
  parking?: boolean;
  petFriendly?: boolean;
  securityDeposit?: number | string;
  landmark?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  updatedAt?: string;

  images?: Array<{
    id: string;
    imageUrl: string;
    isPrimary?: boolean;
  }>;

  amenities?: Array<{
    id: string;
    amenity?: {
      id: string;
      name: string;
    };
  }>;

  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    user?: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;

  favorites?: Array<{
    id: string;
    createdAt: string;
    user?: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;

  visits?: Array<{
    id: string;
    status: string;
    visitDate: string;
    createdAt: string;
    tenant?: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
}

interface PropertiesResponse {
  success: boolean;
  timestamp?: string;
  data: AdminPropertyListItem[];
}

interface PropertyDetailsResponse {
  success: boolean;
  timestamp?: string;
  data: AdminPropertyDetails;
}

interface PropertyActionResponse {
  success?: boolean;
  timestamp?: string;
  message?: string;
  data?: AdminPropertyListItem;
}

export async function getProperties(): Promise<AdminPropertyListItem[]> {
  const response = await apiRequest<PropertiesResponse>("/admin/properties");
  return response.data;
}

export async function getProperty(id: string): Promise<AdminPropertyDetails> {
  const response = await apiRequest<PropertyDetailsResponse>(
    `/admin/properties/${id}`,
  );

  return response.data;
}

export async function hideProperty(id: string): Promise<AdminPropertyListItem> {
  const response = await apiRequest<PropertyActionResponse>(
    `/admin/properties/${id}/hide`,
    {
      method: "PATCH",
    },
  );

  if (response.data) {
    return response.data;
  }

  return getProperty(id);
}

export async function unhideProperty(
  id: string,
): Promise<AdminPropertyListItem> {
  const response = await apiRequest<PropertyActionResponse>(
    `/admin/properties/${id}/unhide`,
    {
      method: "PATCH",
    },
  );

  if (response.data) {
    return response.data;
  }

  return getProperty(id);
}

export async function approveProperty(
  id: string,
): Promise<AdminPropertyListItem> {
  const response = await apiRequest<PropertyActionResponse>(
    `/admin/properties/${id}/approve`,
    { method: "PATCH" },
  );
  return response.data ?? getProperty(id);
}

export async function deleteProperty(id: string): Promise<void> {
  await apiRequest(`/admin/properties/${id}`, {
    method: "DELETE",
  });
}
