import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, User, Flag, ChevronRight, Trash2, Pencil, X, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/tasks/StatusBadge';
import { PriorityBadge } from '../components/tasks/PriorityBadge';
import { CommentThread } from '../components/comments/CommentThread';
import { FileUpload } from '../components/uploads/FileUpload';
import { Select } from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import { useTask, useUpdateTask, useUpdateTaskStatus, useDeleteTask } from '../features/tasks/hooks';
import { formatDate, formatRelative } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import type { TaskStatus, TaskPriority, Task } from '../types';

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') ?? '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const { data: task, isLoading } = useTask(taskId ?? null, workspaceId);
  const updateTask = useUpdateTask(workspaceId);
  const updateStatus = useUpdateTaskStatus(workspaceId);
  const deleteTask = useDeleteTask(workspaceId);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!task) return <div className="text-center py-20 text-gray-500">Task not found.</div>;

  const assignee = typeof task.assigneeId === 'object' && task.assigneeId !== null ? task.assigneeId : null;
  const reporter = typeof task.reporterId === 'object' && task.reporterId !== null ? task.reporterId : null;
  const isOwner = user?._id === (reporter?._id ?? task.reporterId);

  function startEditTitle() {
    setTitleValue(task!.title);
    setEditingTitle(true);
  }
  function saveTitle() {
    if (titleValue.trim() && titleValue !== task!.title) {
      updateTask.mutate({ id: task!._id, data: { title: titleValue.trim() } });
    }
    setEditingTitle(false);
  }

  function handleStatusChange(status: string) {
    updateStatus.mutate({ id: task!._id, status: status as TaskStatus });
  }

  function handlePriorityChange(priority: string) {
    updateTask.mutate({ id: task!._id, data: { priority: priority as TaskPriority } });
  }

  function handleDelete() {
    deleteTask.mutate(task!._id, { onSuccess: () => navigate(-1) });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to="/projects" className="hover:text-primary-600 transition-colors">Projects</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-gray-100 font-medium line-clamp-1">{task.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            {editingTitle ? (
              <div className="flex items-start gap-2">
                <textarea
                  className="flex-1 text-xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-primary-500 focus:outline-none resize-none"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  autoFocus
                  rows={2}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle(); } if (e.key === 'Escape') setEditingTitle(false); }}
                />
                <div className="flex gap-1 mt-1">
                  <button onClick={saveTitle} className="p-1.5 rounded bg-primary-600 text-white hover:bg-primary-700"><Check size={14} /></button>
                  <button onClick={() => setEditingTitle(false)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="group flex items-start gap-2">
                <h1 className="flex-1 text-xl font-bold text-gray-900 dark:text-gray-100">{task.title}</h1>
                {isOwner && (
                  <button onClick={startEditTitle} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Edit title">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <span className="text-xs text-gray-400">Updated {formatRelative(task.updatedAt)}</span>
            </div>

            {task.description && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <FileUpload taskId={task._id} />
          </div>

          {/* Comments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <CommentThread taskId={task._id} workspaceId={workspaceId} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Details</h2>

            <div className="space-y-3">
              <Select
                label="Status"
                options={[
                  { value: 'todo', label: 'Todo' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'review', label: 'Review' },
                  { value: 'done', label: 'Done' },
                ]}
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
              />

              <Select
                label="Priority"
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
              />

              {assignee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                  <div className="flex items-center gap-2">
                    <Avatar name={assignee.name} src={assignee.avatar} size="sm" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{assignee.name}</span>
                  </div>
                </div>
              )}

              {reporter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><User size={12} />Reporter</label>
                  <div className="flex items-center gap-2">
                    <Avatar name={reporter.name} src={reporter.avatar} size="sm" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{reporter.name}</span>
                  </div>
                </div>
              )}

              {task.dueDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Calendar size={12} />Due Date</label>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(task.dueDate)}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"><Flag size={12} />Created</label>
                <span className="text-sm text-gray-500">{formatDate(task.createdAt)}</span>
              </div>
            </div>
          </div>

          {isOwner && (
            <Button variant="danger" className="w-full" icon={<Trash2 size={15} />} onClick={() => setDeleteOpen(true)}>
              Delete Task
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete task"
        message="Are you sure? This cannot be undone."
        confirmLabel="Delete"
        loading={deleteTask.isPending}
      />
    </div>
  );
}
