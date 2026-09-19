import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Spinner } from '../ui/Spinner';
import { formatRelative } from '../../utils/format';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '../../features/comments/hooks';
import { useAuth } from '../../hooks/useAuth';
import type { Comment } from '../../types';

interface CommentThreadProps { taskId: string; workspaceId: string; }

export function CommentThread({ taskId, workspaceId }: CommentThreadProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const { data: comments, isLoading } = useComments(taskId, workspaceId);
  const create = useCreateComment(taskId, workspaceId);
  const update = useUpdateComment(taskId);
  const remove = useDeleteComment(taskId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    create.mutate(text.trim(), { onSuccess: () => setText('') });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Comments</h3>
      {isLoading ? <Spinner /> : (
        <div className="space-y-3">
          {(comments ?? []).map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              isOwn={user?._id === (typeof comment.userId === 'object' ? (comment.userId as { _id: string })._id : comment.userId)}
              onUpdate={(content) => update.mutate({ id: comment._id, content })}
              onDelete={() => remove.mutate(comment._id)}
              updating={update.isPending}
              deleting={remove.isPending}
            />
          ))}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar name={user.name} src={user.avatar} size="sm" className="flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
            />
            {text.trim() && (
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={create.isPending}>Save</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setText('')}>Cancel</Button>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  isOwn: boolean;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  updating: boolean;
  deleting: boolean;
}

function CommentItem({ comment, isOwn, onUpdate, onDelete, updating }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const author = typeof comment.userId === 'object' ? comment.userId as { name: string; avatar?: string | null } : null;

  function saveEdit() {
    if (!editText.trim()) return;
    onUpdate(editText.trim());
    setEditing(false);
  }

  return (
    <div className="flex gap-3 group">
      <Avatar name={author?.name ?? 'User'} src={author?.avatar} size="sm" className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{author?.name ?? 'User'}</span>
          <span className="text-xs text-gray-400">{formatRelative(comment.createdAt)}</span>
          {comment.editedAt && <span className="text-xs text-gray-400">(edited)</span>}
        </div>
        {editing ? (
          <div className="mt-1 space-y-2">
            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} autoFocus />
            <div className="flex gap-2">
              <Button size="xs" onClick={saveEdit} loading={updating} icon={<Check size={12} />}>Save</Button>
              <Button size="xs" variant="ghost" onClick={() => setEditing(false)} icon={<X size={12} />}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
        )}
      </div>
      {isOwn && !editing && (
        <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded" aria-label="Edit">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 rounded" aria-label="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
