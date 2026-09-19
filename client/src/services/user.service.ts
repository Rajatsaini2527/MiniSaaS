import api from '../lib/axios';
import type { ApiResponse, User } from '../types';

export const userService = {
  getProfile: () =>
    api.get<ApiResponse<User>>('/users/me').then((r) => r.data),

  updateProfile: (data: { name?: string; avatar?: string | null }) =>
    api.put<ApiResponse<User>>('/users/me', data).then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse<null>>('/users/me/password', data).then((r) => r.data),
};
