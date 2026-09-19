import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { projectService } from '../../services/project.service';
import { extractError } from '../../utils/format';
import type { Project } from '../../types';

export const PROJECT_KEYS = {
  all: (wsId: string) => ['projects', wsId] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

export function useProjects(workspaceId: string | null, params?: { status?: string }) {
  return useQuery({
    queryKey: [...PROJECT_KEYS.all(workspaceId!), params],
    queryFn: () => projectService.getAll(workspaceId!, { limit: 100, ...params }).then((r) => r.data),
    enabled: !!workspaceId,
  });
}

export function useProject(id: string | null, workspaceId: string | null) {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(id!),
    queryFn: () => projectService.getById(id!, workspaceId!).then((r) => r.data),
    enabled: !!id && !!workspaceId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: projectService.create,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.all(vars.workspaceId) });
      toast.success('Project created');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useUpdateProject(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectService.update(id, workspaceId, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.all(workspaceId) });
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) });
      toast.success('Project updated');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useDeleteProject(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectService.delete(id, workspaceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.all(workspaceId) });
      toast.success('Project deleted');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}
