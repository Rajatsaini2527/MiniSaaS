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
} = require('../helpers/auth.helper');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Project API', () => {
  let ownerToken, ownerUser, workspace;

  beforeEach(async () => {
    const result = await createUserAndLogin({ name: 'Owner' });
    ownerToken = result.accessToken;
    ownerUser = result.user;
    workspace = await createWorkspace(ownerUser._id);
    await addOwnerMember(workspace._id, ownerUser._id);
  });

  // ── Create ──────────────────────────────────────────────────────────────────
  describe('POST /api/v1/projects', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ workspaceId: workspace._id, name: 'My Project', key: 'MYP' });
      expect(res.status).toBe(201);
      expect(res.body.data.key).toBe('MYP');
    });

    it('should reject duplicate key in same workspace', async () => {
      await createProject(workspace._id, ownerUser._id, { key: 'DUP' });
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ workspaceId: workspace._id, name: 'Another', key: 'DUP' });
      expect(res.status).toBe(409);
    });

    it('should forbid guest from creating', async () => {
      const { accessToken: guestToken, user: guestUser } = await createUserAndLogin();
      await addMember(workspace._id, guestUser._id, 'guest');
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ workspaceId: workspace._id, name: 'Guest Project', key: 'GST' });
      expect(res.status).toBe(403);
    });

    it('should reject non-member', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ workspaceId: workspace._id, name: 'Proj', key: 'NMM' });
      expect(res.status).toBe(403);
    });
  });

  // ── List ────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/projects', () => {
    it('should list projects for workspace member', async () => {
      await createProject(workspace._id, ownerUser._id);
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should support status filter', async () => {
      await createProject(workspace._id, ownerUser._id, { key: 'ACT', status: 'active' });
      await createProject(workspace._id, ownerUser._id, { key: 'ARC', status: 'archived' });
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString(), status: 'active' });
      expect(res.status).toBe(200);
      expect(res.body.data.every((p) => p.status === 'active')).toBe(true);
    });

    it('should return 403 for non-member', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(403);
    });
  });

  // ── Get by ID ───────────────────────────────────────────────────────────────
  describe('GET /api/v1/projects/:id', () => {
    it('should return project by ID', async () => {
      const project = await createProject(workspace._id, ownerUser._id);
      const res = await request(app)
        .get(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(project._id.toString());
    });

    it('should return 404 for wrong workspace', async () => {
      const { user: other } = await createUserAndLogin();
      const ws2 = await createWorkspace(other._id);
      await addOwnerMember(ws2._id, other._id);
      const project = await createProject(workspace._id, ownerUser._id);

      const res = await request(app)
        .get(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: ws2._id.toString() });
      expect(res.status).toBe(403);
    });
  });

  // ── Update ──────────────────────────────────────────────────────────────────
  describe('PUT /api/v1/projects/:id', () => {
    it('should update a project', async () => {
      const project = await createProject(workspace._id, ownerUser._id);
      const res = await request(app)
        .put(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ name: 'Updated Name' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should forbid guest from updating', async () => {
      const { accessToken: guestToken, user: guestUser } = await createUserAndLogin();
      await addMember(workspace._id, guestUser._id, 'guest');
      const project = await createProject(workspace._id, ownerUser._id);
      const res = await request(app)
        .put(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ name: 'Hacked' });
      expect(res.status).toBe(403);
    });
  });

  // ── Delete ──────────────────────────────────────────────────────────────────
  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete a project as owner', async () => {
      const project = await createProject(workspace._id, ownerUser._id);
      const res = await request(app)
        .delete(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(200);
    });

    it('should forbid member from deleting', async () => {
      const { accessToken: memberToken, user: memberUser } = await createUserAndLogin();
      await addMember(workspace._id, memberUser._id, 'member');
      const project = await createProject(workspace._id, ownerUser._id);
      const res = await request(app)
        .delete(`/api/v1/projects/${project._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(403);
    });
  });
});
