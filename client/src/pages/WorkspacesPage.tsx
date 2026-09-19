import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MoreHorizontal, Trash2, Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Dropdown } from '../components/ui/Dropdown';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useWorkspaces, useCreateWorkspace, useDeleteWorkspace } from '../features/workspaces/hooks';
import { useWorkspace } from '../hooks/useWorkspace';
import { formatDate } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import type { Workspace } from '../types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  slug: z.string().regex(/^[a-z0-9-]*$/, 'Only lowercase letters, numbers and hyphens').optional().or(z.literal('')),
});
type Form = z.infer<typeof schema>;

export default function WorkspacesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
  const { data: workspaces, isLoading } = useWorkspaces();
  const { switchWorkspace } = useWorkspace();
  const createWs = useCreateWorkspace();
  const deleteWs = useDeleteWorkspace();
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  function onSubmit(data: Form) {
    createWs.mutate({ name: data.name, description: data.description, slug: data.slug || undefined }, {
      onSuccess: () => { reset(); setCreateOpen(false); },
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workspaces</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage all your workspaces</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>New Workspace</Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !workspaces?.length ? (
        <EmptyState
          icon={<Plus size={40} />}
          title="No workspaces yet"
          description="Create your first workspace to get started."
          action={<Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create Workspace</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {workspaces.map((ws) => (
            <div key={ws._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => { switchWorkspace(ws._id); navigate('/dashboard'); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && (switchWorkspace(ws._id), navigate('/dashboard'))}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
                      {ws.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors">{ws.name}</h3>
                      <p className="text-xs text-gray-400">/{ws.slug}</p>
                    </div>
                  </div>
                  {ws.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{ws.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">Created {formatDate(ws.createdAt)}</p>
                </div>
                <Dropdown
                  trigger={<button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Options"><MoreHorizontal size={16} /></button>}
                  items={[
                    { label: 'Settings', icon: <Settings size={14} />, onClick: () => { switchWorkspace(ws._id); navigate('/settings'); } },
                    { label: 'Delete', icon: <Trash2 size={14} />, onClick: () => setDeleteTarget(ws), danger: true },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Workspace" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" error={errors.name?.message} {...register('name')} autoFocus />
          <Textarea label="Description (optional)" error={errors.description?.message} {...register('description')} />
          <Input label="Slug (optional)" error={errors.slug?.message} helperText="Lowercase letters, numbers and hyphens" {...register('slug')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={createWs.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteWs.mutate(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) }); }}
        title="Delete workspace"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteWs.isPending}
      />
    </div>
  );
}
