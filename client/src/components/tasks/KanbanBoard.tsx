import React, { useState, useMemo } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { Modal } from '../ui/Modal';
import { TaskForm } from './TaskForm';
import { EmptyState } from '../ui/EmptyState';
import { useUpdateTaskStatus, useCreateTask } from '../../features/tasks/hooks';
import type { Task, TaskStatus, CreateTaskForm } from '../../types';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'Todo', color: 'border-t-gray-400' },
  { id: 'in_progress', title: 'In Progress', color: 'border-t-blue-500' },
  { id: 'review', title: 'Review', color: 'border-t-yellow-500' },
  { id: 'done', title: 'Done', color: 'border-t-green-500' },
];

interface KanbanBoardProps {
  tasks: Task[];
  workspaceId: string;
  projectId: string;
}

export function KanbanBoard({ tasks, workspaceId, projectId }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);
  const updateStatus = useUpdateTaskStatus(workspaceId);
  const createTask = useCreateTask();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = useMemo(() =>
    COLUMNS.map((col) => ({
      ...col,
      tasks: tasks.filter((t) => t.status === col.id).sort((a, b) => a.position - b.position),
    })), [tasks]);

  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find((t) => t._id === active.id) ?? null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const targetStatus = COLUMNS.find((c) => c.id === over.id)?.id
      ?? tasks.find((t) => t._id === over.id)?.status;

    if (targetStatus && targetStatus !== tasks.find((t) => t._id === active.id)?.status) {
      updateStatus.mutate({ id: active.id as string, status: targetStatus });
    }
  }

  function handleCreateTask(data: CreateTaskForm) {
    createTask.mutate(data, { onSuccess: () => setCreateStatus(null) });
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {columns.map((col) => (
            <div key={col.id} className={`flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 border-t-4 ${col.color} flex flex-col`}>
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{col.title}</span>
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full px-1.5 py-0.5 font-medium">{col.tasks.length}</span>
                </div>
                <button
                  onClick={() => setCreateStatus(col.id)}
                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={`Add task to ${col.title}`}
                >
                  <Plus size={15} />
                </button>
              </div>

              <SortableContext items={col.tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[100px]">
                  {col.tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      Drop tasks here
                    </div>
                  ) : (
                    col.tasks.map((task) => (
                      <TaskCard key={task._id} task={task} workspaceId={workspaceId} />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        {createPortal(
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} workspaceId={workspaceId} overlay />}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      <Modal open={!!createStatus} onClose={() => setCreateStatus(null)} title="Create Task" size="md">
        {createStatus && (
          <TaskForm
            workspaceId={workspaceId}
            projectId={projectId}
            defaultValues={{ status: createStatus }}
            onSubmit={handleCreateTask}
            onCancel={() => setCreateStatus(null)}
            loading={createTask.isPending}
          />
        )}
      </Modal>
    </>
  );
}
