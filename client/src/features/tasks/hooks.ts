import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { taskService } from '../../services/task.service';
import { extractError } from '../../utils/format';
import type { Task, TaskStatus, CreateTaskForm } from '../../types';

export const TASK_KEYS = {
  all: (wsId: string) => ['tasks', wsId] as const,
  board: (wsId: string, projectId: string) => ['tasks', wsId, 'board', projectId] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
  list: (wsId: string, params: object) => ['tasks', wsId, 'list', params] as const,
};

export function useTasks(workspaceId: string | null, params?: {
  projectId?: string; status?: string; priority?: string; assigneeId?: string; search?: string;
  page?: number; limit?: number;
}) {
  return useQuery({
    queryKey: TASK_KEYS.list(workspaceId!, params ?? {}),
    queryFn: () => taskService.getAll(workspaceId!, params).then((r) => r.data),
    enabled: !!workspaceId,
  });
}

export function useTasksInfinite(workspaceId: string | null, params?: {
  projectId?: string; status?: string; priority?: string;
}) {
  return useInfiniteQuery({
    queryKey: [...TASK_KEYS.all(workspaceId!), 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      taskService.getAll(workspaceId!, { ...params, page: pageParam as number, limit: 20 }),
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!workspaceId,
  });
}

export function useTask(id: string | null, workspaceId: string | null) {
  return useQuery({
    queryKey: TASK_KEYS.detail(id!),
    queryFn: () => taskService.getById(id!, workspaceId!).then((r) => r.data),
    enabled: !!id && !!workspaceId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskForm) => taskService.create(data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: TASK_KEYS.all(vars.workspaceId) });
      toast.success('Task created');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useUpdateTask(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      taskService.update(id, workspaceId, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: TASK_KEYS.all(workspaceId) });
      qc.invalidateQueries({ queryKey: TASK_KEYS.detail(id) });
    },
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useUpdateTaskStatus(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskService.updateStatus(id, workspaceId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASK_KEYS.all(workspaceId) }),
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useDeleteTask(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskService.delete(id, workspaceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASK_KEYS.all(workspaceId) });
      toast.success('Task deleted');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}
