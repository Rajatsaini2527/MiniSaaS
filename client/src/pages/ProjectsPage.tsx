import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MoreHorizontal, Trash2, Kanban, List } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Dropdown } from '../components/ui/Dropdown';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useProjects, useCreateProject, useDeleteProject } from '../features/projects/hooks';
import { useWorkspace } from '../hooks/useWorkspace';
import { formatDate } from '../utils/format';
import type { Project } from '../types';

const schema = z.object({
  name: z.string().min(2, 'Name required').max(100),
  key: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/, 'Uppercase letters and numbers only').transform((v) => v.toUpperCase()),
  description: z.string().max(1000).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});
type Form = z.infer<typeof schema>;

const statusVariant = { active: 'success', completed: 'primary', archived: 'default' } as const;

export default function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const { activeWorkspaceId } = useWorkspace();
  const { data: projects, isLoading } = useProjects(activeWorkspaceId, statusFilter ? { status: statusFilter } : undefined);
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject(activeWorkspaceId!);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  function onSubmit(data: Form) {
    if (!activeWorkspaceId) return;
    createProject.mutate({ ...data, workspaceId: activeWorkspaceId }, { onSuccess: () => { reset(); setCreateOpen(false); } });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects?.length ?? 0} project{projects?.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'archived', label: 'Archived' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
          <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)} disabled={!activeWorkspaceId}>
            New Project
          </Button>
        </div>
      </div>

      {!activeWorkspaceId ? (
        <EmptyState title="No workspace selected" description="Select or create a workspace to manage projects." />
      ) : isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !projects?.length ? (
        <EmptyState
          icon={<Kanban size={40} />}
          title="No projects yet"
          description="Create your first project to start tracking tasks."
          action={<Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create Project</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{project.key}</span>
                  <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
                </div>
                <Dropdown
                  trigger={<button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Options"><MoreHorizontal size={15} /></button>}
                  items={[
                    { label: 'Kanban board', icon: <Kanban size={14} />, onClick: () => {} },
                    { label: 'Task list', icon: <List size={14} />, onClick: () => {} },
                    { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => setDeleteTarget(project), danger: true },
                  ]}
                />
              </div>

              <Link to={`/projects/${project._id}/board?workspaceId=${activeWorkspaceId}`} className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors">{project.name}</h3>
                {project.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>}
              </Link>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
                <span>Created {formatDate(project.createdAt)}</span>
                {project.dueDate && <span>Due {formatDate(project.dueDate)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Project" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Project name" error={errors.name?.message} {...register('name')} autoFocus />
          <Input label="Project key" error={errors.key?.message} helperText="2-10 uppercase letters/numbers (e.g. WEB, API)" {...register('key')} />
          <Textarea label="Description" error={errors.description?.message} {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start date" type="date" {...register('startDate')} />
            <Input label="Due date" type="date" {...register('dueDate')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={createProject.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteProject.mutate(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) }); }}
        title="Delete project"
        message={`Delete "${deleteTarget?.name}"? All tasks will be lost.`}
        confirmLabel="Delete"
        loading={deleteProject.isPending}
      />
    </div>
  );
}
