import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { workspaceService } from '../../services/workspace.service';
import { setWorkspaces } from '../../store/workspaceSlice';
import { useAppDispatch } from '../../hooks/useAppSelector';
import { extractError } from '../../utils/format';
import type { Workspace } from '../../types';

export const WORKSPACE_KEYS = {
  all: ['workspaces'] as const,
  detail: (id: string) => ['workspaces', id] as const,
  members: (id: string) => ['workspaces', id, 'members'] as const,
};

export function useWorkspaces() {
  const dispatch = useAppDispatch();
  return useQuery({
    queryKey: WORKSPACE_KEYS.all,
    queryFn: async () => {
      const res = await workspaceService.getAll({ limit: 100 });
      dispatch(setWorkspaces(res.data));
      return res.data;
    },
  });
}

export function useWorkspace(id: string | null) {
  return useQuery({
    queryKey: WORKSPACE_KEYS.detail(id!),
    queryFn: () => workspaceService.getById(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useWorkspaceMembers(id: string | null) {
  return useQuery({
    queryKey: WORKSPACE_KEYS.members(id!),
    queryFn: () => workspaceService.getMembers(id!, { limit: 100 }).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: workspaceService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKSPACE_KEYS.all });
      toast.success('Workspace created');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useUpdateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; description: string | null; slug: string; status: string }> }) =>
      workspaceService.update(id, data as Parameters<typeof workspaceService.update>[1]),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: WORKSPACE_KEYS.all });
      qc.invalidateQueries({ queryKey: WORKSPACE_KEYS.detail(id) });
      toast.success('Workspace updated');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKSPACE_KEYS.all });
      toast.success('Workspace deleted');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useAddMember(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role?: string }) =>
      workspaceService.addMember(workspaceId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKSPACE_KEYS.members(workspaceId) });
      toast.success('Member added');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useRemoveMember(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => workspaceService.removeMember(workspaceId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKSPACE_KEYS.members(workspaceId) });
      toast.success('Member removed');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useUpdateMemberRole(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      workspaceService.updateMemberRole(workspaceId, memberId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WORKSPACE_KEYS.members(workspaceId) });
      toast.success('Role updated');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}
