import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { useAuth } from './useAuth';
import { useWorkspace } from './useWorkspace';
import { TASK_KEYS } from '../features/tasks/hooks';
import { NOTIF_KEYS } from '../features/notifications/hooks';
import type { Task, Notification } from '../types';

export function useSocket() {
  const { isAuthenticated, accessToken } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();
  const joinedWs = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();

    socket.on('connect', () => {
      // Re-join workspace room after reconnect
      if (activeWorkspaceId) {
        socket.emit('workspace:join', { workspaceId: activeWorkspaceId });
        joinedWs.current = activeWorkspaceId;
      }
    });

    // ── Task events ────────────────────────────────────────────────────────
    const invalidateTasks = () => {
      if (activeWorkspaceId) {
        qc.invalidateQueries({ queryKey: TASK_KEYS.all(activeWorkspaceId) });
      }
    };

    socket.on('task.created', invalidateTasks);
    socket.on('task.updated', invalidateTasks);
    socket.on('task.deleted', invalidateTasks);
    socket.on('task.statusChanged', invalidateTasks);

    // ── Notifications ──────────────────────────────────────────────────────
    socket.on('notification.created', (notif: Notification) => {
      qc.invalidateQueries({ queryKey: NOTIF_KEYS.all });
      toast(notif.title, { icon: '🔔', duration: 4000 });
    });

    // ── Online presence ────────────────────────────────────────────────────
    socket.on('user.online', (data: { userId: string; name: string }) => {
      qc.setQueryData(['presence', activeWorkspaceId], (prev: string[] = []) =>
        prev.includes(data.userId) ? prev : [...prev, data.userId]
      );
    });

    socket.on('user.offline', (data: { userId: string }) => {
      qc.setQueryData(['presence', activeWorkspaceId], (prev: string[] = []) =>
        prev.filter((id) => id !== data.userId)
      );
    });

    return () => {
      socket.off('task.created', invalidateTasks);
      socket.off('task.updated', invalidateTasks);
      socket.off('task.deleted', invalidateTasks);
      socket.off('task.statusChanged', invalidateTasks);
      socket.off('notification.created');
      socket.off('user.online');
      socket.off('user.offline');
    };
  }, [isAuthenticated, accessToken, qc]);

  // Join/leave workspace room when active workspace changes
  useEffect(() => {
    if (!isAuthenticated || !activeWorkspaceId) return;
    const socket = getSocket();
    if (!socket.connected) return;

    if (joinedWs.current && joinedWs.current !== activeWorkspaceId) {
      socket.emit('workspace:leave', { workspaceId: joinedWs.current });
    }
    socket.emit('workspace:join', { workspaceId: activeWorkspaceId });
    joinedWs.current = activeWorkspaceId;
  }, [activeWorkspaceId, isAuthenticated]);
}
