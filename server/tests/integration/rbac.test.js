'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const {
  createUserAndLogin,
  createWorkspace,
  addOwnerMember,
  addMember,
  createProject,
  createTask,
} = require('../helpers/auth.helper');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('RBAC & Resource-level Authorization', () => {
  let owner, ownerToken, workspace;

  beforeEach(async () => {
    const result = await createUserAndLogin({ name: 'Owner' });
    ownerToken = result.accessToken;
    owner = result.user;
    workspace = await createWorkspace(owner._id);
    await addOwnerMember(workspace._id, owner._id);
  });

  describe('Workspace isolation — cross-workspace access prevention', () => {
    it('should not allow member of WS-A to access projects in WS-B', async () => {
      const { accessToken: memberToken, user: memberUser } = await createUserAndLogin();
      await addMember(workspace._id, memberUser._id, 'member');

      // Create another workspace the member does NOT belong to
      const { user: other } = await createUserAndLogin();
      const ws2 = await createWorkspace(other._id);
      await addOwnerMember(ws2._id, other._id);

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .query({ workspaceId: ws2._id.toString() });
      expect(res.status).toBe(403);
    });

    it('should not allow non-member to list tasks', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(403);
    });
  });

  describe('Role hierarchy', () => {
    it('guest cannot create tasks', async () => {
      const { accessToken: guestToken, user: guestUser } = await createUserAndLogin();
      await addMember(workspace._id, guestUser._id, 'guest');
      const project = await createProject(workspace._id, owner._id);

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ workspaceId: workspace._id, projectId: project._id, title: 'No' });
      expect(res.status).toBe(403);
    });

    it('member can create tasks', async () => {
      const { accessToken: memberToken, user: memberUser } = await createUserAndLogin();
      await addMember(workspace._id, memberUser._id, 'member');
      const project = await createProject(workspace._id, owner._id);

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ workspaceId: workspace._id, projectId: project._id, title: 'Member task' });
      expect(res.status).toBe(201);
    });

    it('only owner can delete workspace', async () => {
      const { accessToken: adminToken, user: adminUser } = await createUserAndLogin();
      await addMember(workspace._id, adminUser._id, 'admin');

      const res = await request(app)
        .delete(`/api/v1/workspaces/${workspace._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);

      const ownerRes = await request(app)
        .delete(`/api/v1/workspaces/${workspace._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(ownerRes.status).toBe(200);
    });

    it('admin can add members, member cannot', async () => {
      const { accessToken: adminToken, user: adminUser } = await createUserAndLogin();
      await addMember(workspace._id, adminUser._id, 'admin');

      const { accessToken: memberToken, user: memberUser } = await createUserAndLogin();
      await addMember(workspace._id, memberUser._id, 'member');

      const { user: newUser } = await createUserAndLogin();

      // admin can add
      const adminRes = await request(app)
        .post(`/api/v1/workspaces/${workspace._id}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: newUser.email, role: 'member' });
      expect(adminRes.status).toBe(201);

      // member cannot add
      const { user: anotherUser } = await createUserAndLogin();
      const memberRes = await request(app)
        .post(`/api/v1/workspaces/${workspace._id}/members`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ email: anotherUser.email, role: 'member' });
      expect(memberRes.status).toBe(403);
    });

    it('guest can view tasks (read-only)', async () => {
      const { accessToken: guestToken, user: guestUser } = await createUserAndLogin();
      await addMember(workspace._id, guestUser._id, 'guest');
      const project = await createProject(workspace._id, owner._id);
      await createTask(workspace._id, project._id, owner._id);

      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${guestToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(200);
    });
  });

  describe('Expired / invalid tokens', () => {
    it('should return 401 for expired token format', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.invalid');
      expect(res.status).toBe(401);
    });
  });
});
