import React from 'react';
import { Badge } from '../ui/Badge';
import type { TaskPriority } from '../../types';

const map: Record<TaskPriority, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  critical: { label: 'Critical', variant: 'danger' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'info' },
  low: { label: 'Low', variant: 'default' },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, variant } = map[priority];
  return <Badge variant={variant}>{label}</Badge>;
}
