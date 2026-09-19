import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { commentService } from '../../services/comment.service';
import { extractError } from '../../utils/format';

export const COMMENT_KEYS = {
  all: (taskId: string) => ['comments', taskId] as const,
};

export function useComments(taskId: string | null, workspaceId: string | null) {
  return useQuery({
    queryKey: COMMENT_KEYS.all(taskId!),
    queryFn: () => commentService.getAll(taskId!, workspaceId!, { limit: 100 }).then((r) => r.data),
    enabled: !!taskId && !!workspaceId,
  });
}

export function useCreateComment(taskId: string, workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => commentService.create(taskId, workspaceId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMENT_KEYS.all(taskId) }),
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useUpdateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commentService.update(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMENT_KEYS.all(taskId) }),
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMENT_KEYS.all(taskId) }),
    onError: (e) => toast.error(extractError(e)),
  });
}
