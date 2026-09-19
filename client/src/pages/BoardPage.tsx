import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Plus, List, Kanban, Search, ChevronRight } from 'lucide-react';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskCard } from '../components/tasks/TaskCard';
import { Modal } from '../components/ui/Modal';
import { TaskForm } from '../components/tasks/TaskForm';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';
import { TaskSkeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/tasks/StatusBadge';
import { PriorityBadge } from '../components/tasks/PriorityBadge';
import { useProject } from '../features/projects/hooks';
import { useTasks, useCreateTask } from '../features/tasks/hooks';
import { useDebounce } from '../hooks/useDebounce';
import type { CreateTaskForm } from '../types';

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') ?? '';
  const [view, setView] = useState<'board' | 'list'>('board');
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: project, isLoading: projLoading } = useProject(projectId ?? null, workspaceId);
  const { data: tasks, isLoading: taskLoading } = useTasks(workspaceId, {
    projectId: projectId ?? undefined,
    search: debouncedSearch || undefined,
    priority: priorityFilter || undefined,
    limit: 200,
  });
  const createTask = useCreateTask();

  function handleCreate(data: CreateTaskForm) {
    createTask.mutate(data, { onSuccess: () => setCreateOpen(false) });
  }

  const isLoading = projLoading || taskLoading;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to="/projects" className="hover:text-primary-600 transition-colors">Projects</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {projLoading ? '…' : project?.name ?? 'Project'}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {project?.name ?? 'Board'}
          </h1>
          {project?.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
            />
          </div>

          {/* Priority filter */}
          <Select
            options={[
              { value: '', label: 'All priorities' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-36"
          />

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setView('board')}
              className={`p-1.5 ${view === 'board' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              aria-label="Board view" aria-pressed={view === 'board'}
            >
              <Kanban size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 ${view === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              aria-label="List view" aria-pressed={view === 'list'}
            >
              <List size={16} />
            </button>
          </div>

          <Button icon={<Plus size={15} />} size="sm" onClick={() => setCreateOpen(true)} disabled={!workspaceId}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Board / List */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <TaskSkeleton key={i} />)}
          </div>
        ) : !tasks?.length && (debouncedSearch || priorityFilter) ? (
          <EmptyState title="No tasks match your filters" description="Try adjusting your search or filters." />
        ) : view === 'board' ? (
          <KanbanBoard tasks={tasks ?? []} workspaceId={workspaceId} projectId={projectId ?? ''} />
        ) : (
          <ListView tasks={tasks ?? []} workspaceId={workspaceId} />
        )}
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Task" size="md">
        <TaskForm
          workspaceId={workspaceId}
          projectId={projectId ?? ''}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          loading={createTask.isPending}
        />
      </Modal>
    </div>
  );
}

function ListView({ tasks, workspaceId }: { tasks: import('../types').Task[]; workspaceId: string }) {
  if (!tasks.length) return <EmptyState title="No tasks" description="Create a task to get started." />;
  return (
    <div className="space-y-2 overflow-y-auto max-h-full">
      {tasks.map((task) => (
        <div key={task._id} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5">
          <StatusBadge status={task.status} />
          <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">{task.title}</span>
          <PriorityBadge priority={task.priority} />
        </div>
      ))}
    </div>
  );
}
