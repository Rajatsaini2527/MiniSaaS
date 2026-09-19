'use strict';

const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, Workspace, Project, Task, Attachment, ATTACHMENT_PROVIDERS } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Attachment Model', () => {
  let user, task;

  beforeEach(async () => {
    user = await User.create({ name: 'Uploader', email: 'uploader@example.com', password: 'password123' });
    const workspace = await Workspace.create({ name: 'WS', ownerId: user._id, slug: 'attach-ws' });
    const project = await Project.create({ workspaceId: workspace._id, ownerId: user._id, name: 'Project Beta', key: 'ATT' });
    task = await Task.create({ workspaceId: workspace._id, projectId: project._id, title: 'Task', reporterId: user._id });
  });

  const getValidData = (uploadedBy, taskId) => ({
    uploadedBy,
    taskId,
    fileName: 'document-abc123.pdf',
    originalName: 'document.pdf',
    mimeType: 'application/pdf',
    size: 102400,
    url: 'https://storage.example.com/document-abc123.pdf',
    storageKey: 'uploads/document-abc123.pdf',
  });

  describe('Required fields', () => {
    it('should create an attachment with valid data', async () => {
      const attachment = await Attachment.create(getValidData(user._id, task._id));
      expect(attachment._id).toBeDefined();
      expect(attachment.fileName).toBe('document-abc123.pdf');
    });

    it('should fail without uploadedBy', async () => {
      const { uploadedBy: _u, ...data } = getValidData(user._id, task._id);
      await expect(Attachment.create(data)).rejects.toThrow(/Uploader is required/);
    });

    it('should fail without fileName', async () => {
      const { fileName: _f, ...data } = getValidData(user._id, task._id);
      await expect(Attachment.create(data)).rejects.toThrow(/File name is required/);
    });

    it('should fail without url', async () => {
      const { url: _u, ...data } = getValidData(user._id, task._id);
      await expect(Attachment.create(data)).rejects.toThrow(/URL is required/);
    });
  });

  describe('Provider enum', () => {
    it('should default provider to local', async () => {
      const attachment = await Attachment.create(getValidData(user._id, task._id));
      expect(attachment.provider).toBe('local');
    });

    it('should accept all valid providers', async () => {
      for (const provider of ATTACHMENT_PROVIDERS) {
        const a = await Attachment.create({ ...getValidData(user._id, task._id), provider });
        expect(a.provider).toBe(provider);
      }
    });
  });

  describe('Metadata only storage', () => {
    it('should store file metadata but not binary content', async () => {
      const attachment = await Attachment.create(getValidData(user._id, task._id));
      expect(attachment.url).toBeDefined();
      expect(attachment.storageKey).toBeDefined();
      expect(attachment.size).toBe(102400);
    });
  });
});
