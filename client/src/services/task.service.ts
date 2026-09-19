import api from '../lib/axios';
import type { ApiResponse, PaginatedResponse, Task, TaskStatus, CreateTaskForm } from '../types';

export const taskService = {
  create: (data: CreateTaskForm) =>
    api.post<ApiResponse<Task>>('/tasks', data).then((r) => r.data),

  getAll: (workspaceId: string, params?: { page?: number; limit?: number; projectId?: string; status?: string; priority?: string; assigneeId?: string; search?: string }) =>
    api.get<PaginatedResponse<Task>>('/tasks', { params: { workspaceId, ...params } }).then((r) => r.data),

  getById: (id: string, workspaceId: string) =>
    api.get<ApiResponse<Task>>(`/tasks/${id}`, { params: { workspaceId } }).then((r) => r.data),

  update: (id: string, workspaceId: string, data: Partial<Task>) =>
    api.put<ApiResponse<Task>>(`/tasks/${id}`, data, { params: { workspaceId } }).then((r) => r.data),

  delete: (id: string, workspaceId: string) =>
    api.delete<ApiResponse<null>>(`/tasks/${id}`, { params: { workspaceId } }).then((r) => r.data),

  updateStatus: (id: string, workspaceId: string, status: TaskStatus) =>
    api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status }, { params: { workspaceId } }).then((r) => r.data),

  updateAssignee: (id: string, workspaceId: string, assigneeId: string | null) =>
    api.patch<ApiResponse<Task>>(`/tasks/${id}/assignee`, { assigneeId }, { params: { workspaceId } }).then((r) => r.data),
};
