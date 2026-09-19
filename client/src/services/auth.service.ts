import api, { authApi } from '../lib/axios';
import type { ApiResponse, AuthTokens, User, LoginPayload, RegisterPayload } from '../types';

export const authService = {
  // Use authApi (no interceptor) for auth operations to prevent loops
  register: (data: RegisterPayload) =>
    authApi.post<ApiResponse<User>>('/auth/register', data).then((r) => r.data),

  login: (data: LoginPayload) =>
    authApi.post<ApiResponse<AuthTokens>>('/auth/login', data).then((r) => r.data),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout').then((r) => r.data),

  refreshToken: () =>
    authApi.post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token').then((r) => r.data),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me').then((r) => r.data),
};
