import api from '../lib/axios';
import type { ApiResponse, PaginatedResponse, Comment } from '../types';

export const commentService = {
  create: (taskId: string, workspaceId: string, content: string) =>
    api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, { content }, { params: { workspaceId } }).then((r) => r.data),

  getAll: (taskId: string, workspaceId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Comment>>(`/tasks/${taskId}/comments`, { params: { workspaceId, ...params } }).then((r) => r.data),

  update: (id: string, content: string) =>
    api.put<ApiResponse<Comment>>(`/comments/${id}`, { content }).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/comments/${id}`).then((r) => r.data),
};
