import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDueDate(date: string | Date | null | undefined): {
  label: string;
  overdue: boolean;
  soon: boolean;
} {
  if (!date) return { label: 'No due date', overdue: false, soon: false };
  const d = new Date(date);
  const overdue = isPast(d) && !isToday(d);
  const soon = isToday(d) || isTomorrow(d);
  const label = isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : formatDate(d);
  return { label, overdue, soon };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function extractError(error: unknown): string {
  if (!error) return 'An unexpected error occurred';
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || 'An unexpected error occurred';
}
