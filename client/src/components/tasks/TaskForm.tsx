import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { CreateTaskForm, Task } from '../../types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(10000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  dueDate: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormProps {
  workspaceId: string;
  projectId: string;
  defaultValues?: Partial<Task>;
  onSubmit: (data: CreateTaskForm) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export function TaskForm({ workspaceId, projectId, defaultValues, onSubmit, onCancel, loading, submitLabel = 'Create Task' }: TaskFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      priority: defaultValues?.priority ?? 'medium',
      status: defaultValues?.status ?? 'todo',
      dueDate: defaultValues?.dueDate ? defaultValues.dueDate.slice(0, 10) : '',
    },
  });

  const submit = (vals: FormValues) => {
    onSubmit({
      workspaceId,
      projectId,
      title: vals.title,
      description: vals.description || undefined,
      priority: vals.priority,
      status: vals.status,
      dueDate: vals.dueDate || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Input label="Title" error={errors.title?.message} {...register('title')} autoFocus />
      <Textarea label="Description" error={errors.description?.message} rows={3} {...register('description')} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Priority" options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' },
        ]} {...register('priority')} />
        <Select label="Status" options={[
          { value: 'todo', label: 'Todo' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'review', label: 'Review' },
          { value: 'done', label: 'Done' },
        ]} {...register('status')} />
      </div>
      <Input label="Due Date" type="date" error={errors.dueDate?.message} {...register('dueDate')} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}
