'use strict';

const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, Workspace, Project, PROJECT_STATUSES } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Project Model', () => {
  let user, workspace;

  beforeEach(async () => {
    user = await User.create({ name: 'Owner', email: 'owner@example.com', password: 'password123' });
    workspace = await Workspace.create({ name: 'WS', ownerId: user._id, slug: 'ws-test' });
  });

  const getValidData = (wsId, ownerId) => ({
    workspaceId: wsId,
    ownerId,
    name: 'Test Project',
    key: 'TST',
  });

  describe('Required fields', () => {
    it('should create a project with valid data', async () => {
      const project = await Project.create(getValidData(workspace._id, user._id));
      expect(project._id).toBeDefined();
      expect(project.key).toBe('TST');
    });

    it('should fail without workspaceId', async () => {
      const { workspaceId: _w, ...data } = getValidData(workspace._id, user._id);
      await expect(Project.create(data)).rejects.toThrow(/Workspace is required/);
    });

    it('should fail without key', async () => {
      const { key: _k, ...data } = getValidData(workspace._id, user._id);
      await expect(Project.create(data)).rejects.toThrow(/key is required/i);
    });
  });

  describe('Unique constraint', () => {
    it('should enforce unique workspaceId + key', async () => {
      await Project.create(getValidData(workspace._id, user._id));
      await expect(Project.create({ ...getValidData(workspace._id, user._id), name: 'Other' }))
        .rejects.toThrow();
    });

    it('should allow same key in different workspaces', async () => {
      const ws2 = await Workspace.create({ name: 'WS2', ownerId: user._id, slug: 'ws-two' });
      await Project.create(getValidData(workspace._id, user._id));
      const p2 = await Project.create(getValidData(ws2._id, user._id));
      expect(p2._id).toBeDefined();
    });
  });

  describe('Status enum', () => {
    it('should default status to active', async () => {
      const project = await Project.create(getValidData(workspace._id, user._id));
      expect(project.status).toBe('active');
    });

    it('should accept all valid statuses', async () => {
      for (const status of PROJECT_STATUSES) {
        const p = await Project.create({
          ...getValidData(workspace._id, user._id),
          key: `K${status.substring(0, 3).toUpperCase()}`,
          status,
        });
        expect(p.status).toBe(status);
      }
    });
  });
});
