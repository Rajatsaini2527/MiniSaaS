'use strict';

const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, Workspace, Project, Task, TASK_STATUSES, TASK_PRIORITIES } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Task Model', () => {
  let user, workspace, project;

  beforeEach(async () => {
    user = await User.create({ name: 'Reporter', email: 'reporter@example.com', password: 'password123' });
    workspace = await Workspace.create({ name: 'WS', ownerId: user._id, slug: 'task-ws' });
    project = await Project.create({ workspaceId: workspace._id, ownerId: user._id, name: 'Project', key: 'PRJ' });
  });

  const getValidData = (wsId, pId, rId) => ({
    workspaceId: wsId,
    projectId: pId,
    title: 'Test Task',
    reporterId: rId,
  });

  describe('Required fields', () => {
    it('should create a task with valid data', async () => {
      const task = await Task.create(getValidData(workspace._id, project._id, user._id));
      expect(task._id).toBeDefined();
      expect(task.title).toBe('Test Task');
    });

    it('should fail without title', async () => {
      const { title: _t, ...data } = getValidData(workspace._id, project._id, user._id);
      await expect(Task.create(data)).rejects.toThrow(/title is required/i);
    });

    it('should fail without reporterId', async () => {
      const { reporterId: _r, ...data } = getValidData(workspace._id, project._id, user._id);
      await expect(Task.create(data)).rejects.toThrow(/Reporter is required/);
    });
  });

  describe('Status enum', () => {
    it('should default status to todo', async () => {
      const task = await Task.create(getValidData(workspace._id, project._id, user._id));
      expect(task.status).toBe('todo');
    });

    it('should accept all valid statuses', async () => {
      for (const status of TASK_STATUSES) {
        const t = await Task.create({ ...getValidData(workspace._id, project._id, user._id), title: `Task ${status}`, status });
        expect(t.status).toBe(status);
      }
    });

    it('should reject invalid status', async () => {
      await expect(Task.create({ ...getValidData(workspace._id, project._id, user._id), status: 'pending' }))
        .rejects.toThrow(/Status must be one of/);
    });
  });

  describe('Priority enum', () => {
    it('should default priority to medium', async () => {
      const task = await Task.create(getValidData(workspace._id, project._id, user._id));
      expect(task.priority).toBe('medium');
    });

    it('should accept all valid priorities', async () => {
      for (const priority of TASK_PRIORITIES) {
        const t = await Task.create({ ...getValidData(workspace._id, project._id, user._id), title: `Task ${priority}`, priority });
        expect(t.priority).toBe(priority);
      }
    });
  });

  describe('Indexes', () => {
    it('should have text index on title and description', async () => {
      const indexes = await Task.collection.getIndexes();
      const hasTextIndex = Object.values(indexes).some(
        (idx) => idx.some && idx.some((field) => field[1] === 'text')
      );
      expect(hasTextIndex).toBe(true);
    });
  });
});
