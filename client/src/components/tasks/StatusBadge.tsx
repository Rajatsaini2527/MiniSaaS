import React from 'react';
import { Badge } from '../ui/Badge';
import type { TaskStatus } from '../../types';

const map: Record<TaskStatus, { label: string; variant: 'default' | 'info' | 'warning' | 'success' }> = {
  todo: { label: 'Todo', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'info' },
  review: { label: 'Review', variant: 'warning' },
  done: { label: 'Done', variant: 'success' },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
