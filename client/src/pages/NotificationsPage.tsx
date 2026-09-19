import React, { useRef, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../features/notifications/hooks';
import { formatRelative } from '../utils/format';
import type { Notification } from '../types';
import { cn } from '../utils/cn';

const TYPE_LABELS: Record<Notification['type'], string> = {
  task_assigned: 'Task assigned',
  task_updated: 'Task updated',
  comment_added: 'New comment',
  project_invite: 'Project invite',
  workspace_invite: 'Workspace invite',
  system: 'System',
};

export default function NotificationsPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();

  const notifications = data?.pages.flatMap((p) => p.data) ?? [];
  const unreadCount = (data?.pages[0]?.meta?.unreadCount as number) ?? 0;

  // Infinite scroll observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    });
    if (node) observer.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" icon={<CheckCheck size={15} />} onClick={() => markAll.mutate()} loading={markAll.isPending}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !notifications.length ? (
        <EmptyState icon={<Bell size={40} />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
          {notifications.map((notif, idx) => (
            <div
              key={notif._id}
              ref={idx === notifications.length - 1 ? lastRef : null}
              className={cn(
                'flex items-start gap-3 px-4 py-4 transition-colors cursor-pointer',
                notif.isRead ? 'bg-white dark:bg-gray-800' : 'bg-primary-50 dark:bg-primary-900/10',
                'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              )}
              onClick={() => !notif.isRead && markAsRead.mutate(notif._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !notif.isRead && markAsRead.mutate(notif._id)}
              aria-label={notif.isRead ? notif.title : `Unread: ${notif.title}`}
            >
              <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', notif.isRead ? 'bg-transparent' : 'bg-primary-600')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">{TYPE_LABELS[(notif as Notification).type]}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(notif.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{notif.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFetchingNextPage && (
        <div className="flex justify-center py-4"><Spinner /></div>
      )}
    </div>
  );
}
