import api from '../lib/axios';
import type { ApiResponse, PaginatedResponse, Workspace, WorkspaceMember } from '../types';

export const workspaceService = {
  create: (data: { name: string; description?: string; slug?: string }) =>
    api.post<ApiResponse<Workspace>>('/workspaces', data).then((r) => r.data),

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Workspace>>('/workspaces', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Workspace>>(`/workspaces/${id}`).then((r) => r.data),

  update: (id: string, data: Partial<{ name: string; description: string; slug: string; status: string }>) =>
    api.put<ApiResponse<Workspace>>(`/workspaces/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/workspaces/${id}`).then((r) => r.data),

  // Members
  getMembers: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<WorkspaceMember>>(`/workspaces/${id}/members`, { params }).then((r) => r.data),

  addMember: (id: string, data: { email: string; role?: string }) =>
    api.post<ApiResponse<WorkspaceMember>>(`/workspaces/${id}/members`, data).then((r) => r.data),

  updateMemberRole: (workspaceId: string, memberId: string, role: string) =>
    api.put<ApiResponse<WorkspaceMember>>(`/workspaces/${workspaceId}/members/${memberId}`, { role }).then((r) => r.data),

  removeMember: (workspaceId: string, memberId: string) =>
    api.delete<ApiResponse<null>>(`/workspaces/${workspaceId}/members/${memberId}`).then((r) => r.data),
};
