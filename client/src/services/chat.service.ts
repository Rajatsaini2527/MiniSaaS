import api from '../lib/axios';

export interface ChatMessage {
  _id: string;
  workspaceId: string;
  projectId: string | null;
  content: string;
  user: { _id: string; name: string; avatar: string | null };
  createdAt: string;
  editedAt?: string | null;
}

export const chatService = {
  getMessages: (workspaceId: string, params?: { projectId?: string; before?: string; limit?: number }) =>
    api.get<{ success: boolean; data: ChatMessage[] }>(`/chat/${workspaceId}/messages`, { params }).then((r) => r.data),

  deleteMessage: (id: string) =>
    api.delete(`/chat/messages/${id}`).then((r) => r.data),
};
