import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notification.service';
import { extractError } from '../../utils/format';

export const NOTIF_KEYS = {
  all: ['notifications'] as const,
};

export function useNotifications(params?: { isRead?: string }) {
  return useInfiniteQuery({
    queryKey: [...NOTIF_KEYS.all, params],
    queryFn: ({ pageParam = 1 }) =>
      notificationService.getAll({ page: pageParam as number, limit: 20, ...params }),
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEYS.all }),
    onError: (e) => toast.error(extractError(e)),
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEYS.all });
      toast.success('All notifications marked as read');
    },
    onError: (e) => toast.error(extractError(e)),
  });
}
