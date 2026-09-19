import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { TaskForm } from '../components/tasks/TaskForm';
import { StatusBadge } from '../components/tasks/StatusBadge';
import { PriorityBadge } from '../components/tasks/PriorityBadge';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useTasksInfinite, useCreateTask } from '../features/tasks/hooks';
import { useProjects } from '../features/projects/hooks';
import { useWorkspace } from '../hooks/useWorkspace';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate } from '../utils/format';
import type { CreateTaskForm } from '../types';

export default function TasksPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [projectId, setProjectId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: projects } = useProjects(activeWorkspaceId);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTasksInfinite(
    activeWorkspaceId,
    {
      projectId: projectId || undefined,
      status: status || undefined,
      priority: priority || undefined,
    }
  );
  const createTask = useCreateTask();

  const tasks = data?.pages.flatMap((p) => p.data) ?? [];
  const filtered = debouncedSearch
    ? tasks.filter((t) => t.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : tasks;

  function handleCreate(form: CreateTaskForm) {
    createTask.mutate(form, { onSuccess: () => setCreateOpen(false) });
  }

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...(projects?.map((p) => ({ value: p._id, label: p.name })) ?? []),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)} disabled={!activeWorkspaceId || !projects?.length}>
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Select options={projectOptions} value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-40" />
        <Select options={[{ value: '', label: 'All statuses' }, { value: 'todo', label: 'Todo' }, { value: 'in_progress', label: 'In Progress' }, { value: 'review', label: 'Review' }, { value: 'done', label: 'Done' }]} value={status} onChange={(e) => setStatus(e.target.value)} className="w-36" />
        <Select options={[{ value: '', label: 'All priorities' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} value={priority} onChange={(e) => setPriority(e.target.value)} className="w-36" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-5"><TableSkeleton /></div>
        ) : !filtered.length ? (
          <EmptyState title="No tasks found" description="Create a task or adjust your filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Title</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Priority</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Assignee</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map((task) => {
                    const assignee = typeof task.assigneeId === 'object' && task.assigneeId ? task.assigneeId : null;
                    return (
                      <tr key={task._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/tasks/${task._id}?workspaceId=${activeWorkspaceId}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 line-clamp-1">
                            {task.title}
                          </Link>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell"><StatusBadge status={task.status} /></td>
                        <td className="px-3 py-3 hidden md:table-cell"><PriorityBadge priority={task.priority} /></td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          {assignee ? <div className="flex items-center gap-1.5"><Avatar name={assignee.name} src={assignee.avatar} size="xs" /><span className="text-gray-700 dark:text-gray-300 text-xs">{assignee.name}</span></div> : <span className="text-gray-400 text-xs">Unassigned</span>}
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell text-gray-500 text-xs">{task.dueDate ? formatDate(task.dueDate) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {hasNextPage && (
              <div className="flex justify-center p-4 border-t border-gray-100 dark:border-gray-700">
                <Button variant="outline" size="sm" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Task" size="md">
        {projects?.[0] && (
          <TaskForm
            workspaceId={activeWorkspaceId!}
            projectId={projectId || projects[0]._id}
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            loading={createTask.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
