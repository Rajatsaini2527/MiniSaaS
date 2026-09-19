import api from '../lib/axios';
import type { ApiResponse, PaginatedResponse, Notification } from '../types';

export const notificationService = {
  getAll: (params?: { page?: number; limit?: number; isRead?: string }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }).then((r) => r.data),

  markAsRead: (id: string) =>
    api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.patch<ApiResponse<null>>('/notifications/read-all').then((r) => r.data),
};
