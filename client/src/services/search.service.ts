import api from '../lib/axios';
import type { User, Workspace, Project, Task } from '../types';

export interface SearchResults {
  users: Pick<User, '_id' | 'name' | 'email' | 'avatar'>[];
  workspaces: Pick<Workspace, '_id' | 'name' | 'description' | 'slug' | 'status'>[];
  projects: Pick<Project, '_id' | 'name' | 'description' | 'key' | 'status' | 'workspaceId'>[];
  tasks: Pick<Task, '_id' | 'title' | 'status' | 'priority' | 'workspaceId' | 'projectId'>[];
}

export const searchService = {
  search: (q: string, workspaceId?: string) =>
    api
      .get<{ success: boolean; data: SearchResults }>('/search', { params: { q, workspaceId } })
      .then((r) => r.data),
};
