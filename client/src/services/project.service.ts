import api from '../lib/axios';
import type { ApiResponse, PaginatedResponse, Project } from '../types';

export const projectService = {
  create: (data: { workspaceId: string; name: string; key: string; description?: string; startDate?: string; dueDate?: string }) =>
    api.post<ApiResponse<Project>>('/projects', data).then((r) => r.data),

  getAll: (workspaceId: string, params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Project>>('/projects', { params: { workspaceId, ...params } }).then((r) => r.data),

  getById: (id: string, workspaceId: string) =>
    api.get<ApiResponse<Project>>(`/projects/${id}`, { params: { workspaceId } }).then((r) => r.data),

  update: (id: string, workspaceId: string, data: Partial<Project>) =>
    api.put<ApiResponse<Project>>(`/projects/${id}`, data, { params: { workspaceId } }).then((r) => r.data),

  delete: (id: string, workspaceId: string) =>
    api.delete<ApiResponse<null>>(`/projects/${id}`, { params: { workspaceId } }).then((r) => r.data),
};
