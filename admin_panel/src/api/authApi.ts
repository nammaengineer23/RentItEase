import { apiRequest } from "./http";

export interface LoginUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  role: "USER" | "OWNER" | "ADMIN";
}

export interface LoginData {
  success: boolean;
  message: string;
  user: LoginUser;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginResponse {
  success: boolean;
  timestamp?: string;
  data: LoginData;
}

export interface MeResponse {
  success: boolean;
  timestamp?: string;
  data: AdminUser;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  role: "USER" | "OWNER" | "ADMIN";
  isActive?: boolean;
  createdAt?: string;
}

export async function login(
  loginValue: string,
  password: string,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      login: loginValue,
      password,
    }),
  });
}

export async function getMe(): Promise<AdminUser> {
  const response = await apiRequest<MeResponse>("/auth/me");
  return response.data;
}
