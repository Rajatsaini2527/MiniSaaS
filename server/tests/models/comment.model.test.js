'use strict';

const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, Workspace, Project, Task, Comment } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Comment Model', () => {
  let user, task;

  beforeEach(async () => {
    user = await User.create({ name: 'Commenter', email: 'c@example.com', password: 'password123' });
    const workspace = await Workspace.create({ name: 'WS', ownerId: user._id, slug: 'comment-ws' });
    const project = await Project.create({ workspaceId: workspace._id, ownerId: user._id, name: 'Project Alpha', key: 'CMT' });
    task = await Task.create({ workspaceId: workspace._id, projectId: project._id, title: 'Task', reporterId: user._id });
  });

  describe('Required fields', () => {
    it('should create a comment with valid data', async () => {
      const comment = await Comment.create({ taskId: task._id, userId: user._id, content: 'Hello world' });
      expect(comment._id).toBeDefined();
      expect(comment.content).toBe('Hello world');
    });

    it('should fail without taskId', async () => {
      await expect(Comment.create({ userId: user._id, content: 'test' }))
        .rejects.toThrow(/Task is required/);
    });

    it('should fail without userId', async () => {
      await expect(Comment.create({ taskId: task._id, content: 'test' }))
        .rejects.toThrow(/User is required/);
    });

    it('should fail without content', async () => {
      await expect(Comment.create({ taskId: task._id, userId: user._id }))
        .rejects.toThrow(/content is required/i);
    });
  });

  describe('Defaults', () => {
    it('should default editedAt to null', async () => {
      const comment = await Comment.create({ taskId: task._id, userId: user._id, content: 'Test' });
      expect(comment.editedAt).toBeNull();
    });

    it('should default deletedAt to null', async () => {
      const comment = await Comment.create({ taskId: task._id, userId: user._id, content: 'Test' });
      expect(comment.deletedAt).toBeNull();
    });
  });
});
