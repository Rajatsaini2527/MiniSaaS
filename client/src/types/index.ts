// ── API Response shapes ────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
  meta?: Record<string, unknown>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: 'active' | 'inactive' | 'suspended';
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

// ── Workspace ──────────────────────────────────────────────────────────────────
export interface Workspace {
  _id: string;
  name: string;
  description: string | null;
  ownerId: string;
  slug: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  _id: string;
  workspaceId: string;
  userId: User | string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ── Project ────────────────────────────────────────────────────────────────────
export interface Project {
  _id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  description: string | null;
  key: string;
  status: 'active' | 'completed' | 'archived';
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Task ───────────────────────────────────────────────────────────────────────
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  _id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: User | null;
  reporterId: User | null;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// ── Comment ────────────────────────────────────────────────────────────────────
export interface Comment {
  _id: string;
  taskId: string;
  userId: User | string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Notification ───────────────────────────────────────────────────────────────
export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'comment_added'
  | 'project_invite'
  | 'workspace_invite'
  | 'system';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Forms ──────────────────────────────────────────────────────────────────────
export interface CreateWorkspaceForm {
  name: string;
  description?: string;
  slug?: string;
}

export interface CreateProjectForm {
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
}

export interface CreateTaskForm {
  workspaceId: string;
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface UpdateTaskForm {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
}

// ── Board ──────────────────────────────────────────────────────────────────────
export interface BoardColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

// ── Attachment ─────────────────────────────────────────────────────────────────
export interface Attachment {
  _id: string;
  uploadedBy: User | string;
  taskId: string | null;
  projectId: string | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  storageKey: string;
  provider: 'local' | 's3' | 'gcs' | 'azure';
  createdAt: string;
  updatedAt: string;
}

// ── Chat ───────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  _id: string;
  workspaceId: string;
  projectId: string | null;
  content: string;
  user: Pick<User, '_id' | 'name' | 'avatar'>;
  createdAt: string;
  editedAt?: string | null;
}
