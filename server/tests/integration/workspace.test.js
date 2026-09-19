'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const {
  createUserAndLogin,
  createWorkspace,
  addOwnerMember,
  addMember,
} = require('../helpers/auth.helper');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Workspace API', () => {
  // ── Create ──────────────────────────────────────────────────────────────────
  describe('POST /api/v1/workspaces', () => {
    it('should create a workspace', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'My Workspace', description: 'A workspace' });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('My Workspace');
      expect(res.body.data.slug).toBeDefined();
    });

    it('should accept custom slug', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'My WS', slug: 'my-custom-slug' });
      expect(res.status).toBe(201);
      expect(res.body.data.slug).toBe('my-custom-slug');
    });

    it('should reject duplicate slug', async () => {
      const { accessToken, user } = await createUserAndLogin();
      await createWorkspace(user._id, { slug: 'taken-slug' });
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Another WS', slug: 'taken-slug' });
      expect(res.status).toBe(409);
    });

    it('should require authentication', async () => {
      const res = await request(app).post('/api/v1/workspaces').send({ name: 'WS' });
      expect(res.status).toBe(401);
    });
  });

  // ── List ────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/workspaces', () => {
    it('should list workspaces for current user', async () => {
      const { accessToken, user } = await createUserAndLogin();
      const ws = await createWorkspace(user._id);
      await addOwnerMember(ws._id, user._id);
      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should not include workspaces the user is not a member of', async () => {
      const { accessToken } = await createUserAndLogin();
      const { user: other } = await createUserAndLogin();
      await createWorkspace(other._id);

      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ── Get by ID ───────────────────────────────────────────────────────────────
  describe('GET /api/v1/workspaces/:id', () => {
    it('should return workspace for member', async () => {
      const { accessToken, user } = await createUserAndLogin();
      const ws = await createWorkspace(user._id);
      await addOwnerMember(ws._id, user._id);
      const res = await request(app)
        .get(`/api/v1/workspaces/${ws._id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(ws._id.toString());
    });

    it('should return 403 for non-member', async () => {
      const { accessToken } = await createUserAndLogin();
      const { user: other } = await createUserAndLogin();
      const ws = await createWorkspace(other._id);
      const res = await request(app)
        .get(`/api/v1/workspaces/${ws._id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent workspace', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/workspaces/64a1b2c3d4e5f6a7b8c9d0e1')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── Update ──────────────────────────────────────────────────────────────────
  describe('PUT /api/v1/workspaces/:id', () => {
    it('should update workspace as owner', async () => {
      const { accessToken, user } = await createUserAndLogin();
      const ws = await createWorkspace(user._id);
      await addOwnerMember(ws._id, user._id);
      const res = await request(app)
        .put(`/api/v1/workspaces/${ws._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should forbid update for member role', async () => {
      const { user: owner } = await createUserAndLogin();
      const { accessToken: memberToken, user: memberUser } = await createUserAndLogin();
      const ws = await createWorkspace(owner._id);
      await addOwnerMember(ws._id, owner._id);
      await addMember(ws._id, memberUser._id, 'member');

      const res = await request(app)
        .put(`/api/v1/workspaces/${ws._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Hacked' });
      expect(res.status).toBe(403);
    });
  });

  // ── Delete ──────────────────────────────────────────────────────────────────
  describe('DELETE /api/v1/workspaces/:id', () => {
    it('should delete workspace as owner', async () => {
      const { accessToken, user } = await createUserAndLogin();
      const ws = await createWorkspace(user._id);
      await addOwnerMember(ws._id, user._id);
      const res = await request(app)
        .delete(`/api/v1/workspaces/${ws._id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
    });

    it('should forbid delete for admin role', async () => {
      const { user: owner } = await createUserAndLogin();
      const { accessToken: adminToken, user: adminUser } = await createUserAndLogin();
      const ws = await createWorkspace(owner._id);
      await addOwnerMember(ws._id, owner._id);
      await addMember(ws._id, adminUser._id, 'admin');

      const res = await request(app)
        .delete(`/api/v1/workspaces/${ws._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── Members ─────────────────────────────────────────────────────────────────
  describe('Workspace Members', () => {
    it('should add a member', async () => {
      const { accessToken, user } = await createUserAndLogin();
      const { user: newUser } = await createUserAndLogin();
      const ws = await createWorkspace(user._id);
      await addOwnerMember(ws._id, user._id);

      const res = await request(app)
        .post(`/api/v1/workspaces/${ws._id}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: newUser.email, role: 'member' });
      expect(res.status).toBe(201);
    });

    it('should reject adding already-member', async () => {
      const { accessToken, user } = await createUserAndLogin();
      const { user: newUser } = await createUserAndLogin();
      const ws = await createWorkspace(user._id);
      await addOwnerMember(ws._id, user._id);
      await addMember(ws._id, newUser._id, 'member');

      const res = await request(app)
        .post(`/api/v1/workspaces/${ws._id}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: newUser.email });
      expect(res.status).toBe(409);
    });

    it('should list members', async () => {
      const { accessToken, user } = await createUserAndLogin();
      const ws = await createWorkspace(user._id);
      await addOwnerMember(ws._id, user._id);
      const res = await request(app)
        .get(`/api/v1/workspaces/${ws._id}/members`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should remove a member', async () => {
      const { accessToken, user } = await createUserAndLogin();
      const { user: memberUser } = await createUserAndLogin();
      const ws = await createWorkspace(user._id);
      await addOwnerMember(ws._id, user._id);
      const membership = await addMember(ws._id, memberUser._id, 'member');

      const res = await request(app)
        .delete(`/api/v1/workspaces/${ws._id}/members/${membership._id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
    });

    it('should forbid member-role from adding others', async () => {
      const { user: owner } = await createUserAndLogin();
      const { accessToken: memberToken, user: memberUser } = await createUserAndLogin();
      const { user: newUser } = await createUserAndLogin();
      const ws = await createWorkspace(owner._id);
      await addOwnerMember(ws._id, owner._id);
      await addMember(ws._id, memberUser._id, 'member');

      const res = await request(app)
        .post(`/api/v1/workspaces/${ws._id}/members`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ email: newUser.email });
      expect(res.status).toBe(403);
    });
  });
});
