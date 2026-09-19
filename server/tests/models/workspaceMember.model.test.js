'use strict';

const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, Workspace, WorkspaceMember, WORKSPACE_MEMBER_ROLES } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('WorkspaceMember Model', () => {
  let user, workspace;

  beforeEach(async () => {
    user = await User.create({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    workspace = await Workspace.create({ name: 'Test WS', ownerId: user._id, slug: 'test-ws' });
  });

  describe('Required fields', () => {
    it('should create a member with valid data', async () => {
      const member = await WorkspaceMember.create({ workspaceId: workspace._id, userId: user._id, role: 'member' });
      expect(member._id).toBeDefined();
    });

    it('should fail without workspaceId', async () => {
      await expect(WorkspaceMember.create({ userId: user._id, role: 'member' }))
        .rejects.toThrow(/Workspace is required/);
    });

    it('should fail without userId', async () => {
      await expect(WorkspaceMember.create({ workspaceId: workspace._id, role: 'member' }))
        .rejects.toThrow(/User is required/);
    });
  });

  describe('Unique compound index', () => {
    it('should enforce unique workspaceId + userId', async () => {
      await WorkspaceMember.create({ workspaceId: workspace._id, userId: user._id, role: 'member' });
      await expect(WorkspaceMember.create({ workspaceId: workspace._id, userId: user._id, role: 'admin' }))
        .rejects.toThrow();
    });
  });

  describe('Role enum', () => {
    it('should default role to member', async () => {
      const member = await WorkspaceMember.create({ workspaceId: workspace._id, userId: user._id });
      expect(member.role).toBe('member');
    });

    it('should accept all valid roles', async () => {
      const user2 = await User.create({ name: 'U2', email: 'u2@e.com', password: 'password123' });
      for (const role of WORKSPACE_MEMBER_ROLES) {
        const u = await User.create({ name: role, email: `${role}@e.com`, password: 'password123' });
        const m = await WorkspaceMember.create({ workspaceId: workspace._id, userId: u._id, role });
        expect(m.role).toBe(role);
      }
      expect(user2).toBeDefined();
    });

    it('should reject invalid role', async () => {
      await expect(WorkspaceMember.create({ workspaceId: workspace._id, userId: user._id, role: 'superadmin' }))
        .rejects.toThrow(/Role must be one of/);
    });
  });
});
