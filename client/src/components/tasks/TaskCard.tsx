import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Calendar, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { PriorityBadge } from './PriorityBadge';
import { Avatar } from '../ui/Avatar';
import { formatDueDate } from '../../utils/format';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  workspaceId: string;
  overlay?: boolean;
}

export function TaskCard({ task, workspaceId, overlay }: TaskCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const due = formatDueDate(task.dueDate);
  const assignee = typeof task.assigneeId === 'object' && task.assigneeId !== null ? task.assigneeId : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer select-none',
        'hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all',
        isDragging && 'opacity-40',
        overlay && 'shadow-xl rotate-1 opacity-100'
      )}
      onClick={() => navigate(`/tasks/${task._id}?workspaceId=${workspaceId}`)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag task"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{task.title}</p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {task.dueDate && (
                <span className={cn('flex items-center gap-1', due.overdue && 'text-red-500', due.soon && !due.overdue && 'text-amber-500')}>
                  <Calendar size={11} />
                  {due.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MessageSquare size={11} />
              </span>
              {assignee && <Avatar name={assignee.name} src={assignee.avatar} size="xs" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
