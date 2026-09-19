import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, CheckSquare, AlertCircle, TrendingUp } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/tasks/StatusBadge';
import { PriorityBadge } from '../components/tasks/PriorityBadge';
import { useWorkspace } from '../hooks/useWorkspace';
import { useProjects } from '../features/projects/hooks';
import { useTasks } from '../features/tasks/hooks';
import { useAuth } from '../hooks/useAuth';
import { formatRelative } from '../utils/format';
import type { TaskStatus, TaskPriority } from '../types';

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#94a3b8', in_progress: '#3b82f6', review: '#f59e0b', done: '#22c55e'
};
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#94a3b8', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const { data: projects, isLoading: projLoading } = useProjects(activeWorkspaceId);
  const { data: tasks, isLoading: taskLoading } = useTasks(activeWorkspaceId, { limit: 100 });
  const { data: myTasks } = useTasks(activeWorkspaceId, { assigneeId: user?._id, limit: 100 });

  const totalProjects = projects?.length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === 'done').length ?? 0;
  const overdueTasks = tasks?.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length ?? 0;

  const statusCounts = (['todo', 'in_progress', 'review', 'done'] as TaskStatus[]).map((s) => ({
    status: s, count: tasks?.filter((t) => t.status === s).length ?? 0,
  }));
  const priorityCounts = (['critical', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => ({
    priority: p, count: tasks?.filter((t) => t.priority === p && t.status !== 'done').length ?? 0,
  }));

  const isLoading = projLoading || taskLoading;
  const recentTasks = [...(myTasks ?? [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here's what's happening in your workspace.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FolderKanban} label="Total Projects" value={totalProjects} color="bg-primary-500" />
          <StatCard icon={CheckSquare} label="Total Tasks" value={totalTasks} color="bg-blue-500" />
          <StatCard icon={TrendingUp} label="Completed" value={completedTasks} color="bg-green-500" />
          <StatCard icon={AlertCircle} label="Overdue" value={overdueTasks} color="bg-red-500" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasks by status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tasks by Status</h2>
          <div className="space-y-3">
            {statusCounts.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-3">
                <StatusBadge status={status} />
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${totalTasks > 0 ? (count / totalTasks) * 100 : 0}%`, backgroundColor: STATUS_COLORS[status] }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by priority */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Open Tasks by Priority</h2>
          <div className="space-y-3">
            {priorityCounts.map(({ priority, count }) => {
              const openTotal = tasks?.filter((t) => t.status !== 'done').length ?? 1;
              return (
                <div key={priority} className="flex items-center gap-3">
                  <PriorityBadge priority={priority} />
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${openTotal > 0 ? (count / openTotal) * 100 : 0}%`, backgroundColor: PRIORITY_COLORS[priority] }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">My Recent Tasks</h2>
          <Link to="/tasks" className="text-xs text-primary-600 hover:underline font-medium">View all</Link>
        </div>
        {recentTasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No tasks assigned yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentTasks.map((task) => (
              <div key={task._id} className="py-3 flex items-center gap-3">
                <StatusBadge status={task.status} />
                <Link to={`/tasks/${task._id}?workspaceId=${activeWorkspaceId}`} className="flex-1 text-sm text-gray-900 dark:text-gray-100 hover:text-primary-600 truncate">
                  {task.title}
                </Link>
                <PriorityBadge priority={task.priority} />
                <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(task.updatedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
