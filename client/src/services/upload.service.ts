import api from '../lib/axios';
import type { Attachment } from '../types';

export const uploadService = {
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post<{ success: boolean; data: { url: string } }>('/upload/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  uploadAttachment: (file: File, params: { workspaceId: string; taskId?: string; projectId?: string }) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ success: boolean; data: Attachment }>('/upload/attachment', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
    }).then((r) => r.data);
  },

  getAttachments: (params: { taskId?: string; projectId?: string }) =>
    api.get<{ success: boolean; data: Attachment[] }>('/upload/attachments', { params }).then((r) => r.data),

  deleteAttachment: (id: string) =>
    api.delete(`/upload/attachment/${id}`).then((r) => r.data),
};
