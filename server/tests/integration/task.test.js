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

describe('Task API', () => {
  let ownerToken, ownerUser, workspace, project;

  beforeEach(async () => {
    const result = await createUserAndLogin({ name: 'Owner' });
    ownerToken = result.accessToken;
    ownerUser = result.user;
    workspace = await createWorkspace(ownerUser._id);
    await addOwnerMember(workspace._id, ownerUser._id);
    project = await createProject(workspace._id, ownerUser._id);
  });

  // ── Create ──────────────────────────────────────────────────────────────────
  describe('POST /api/v1/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          workspaceId: workspace._id,
          projectId: project._id,
          title: 'Fix the bug',
          priority: 'high',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Fix the bug');
      expect(res.body.data.status).toBe('todo');
    });

    it('should create task with assignee and send notification', async () => {
      const { user: assignee } = await createUserAndLogin();
      await addMember(workspace._id, assignee._id, 'member');
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          workspaceId: workspace._id,
          projectId: project._id,
          title: 'Assigned Task',
          assigneeId: assignee._id,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.assigneeId).toBeDefined();
    });

    it('should reject missing title', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ workspaceId: workspace._id, projectId: project._id });
      expect(res.status).toBe(400);
    });

    it('should forbid guest from creating', async () => {
      const { accessToken: guestToken, user: guestUser } = await createUserAndLogin();
      await addMember(workspace._id, guestUser._id, 'guest');
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ workspaceId: workspace._id, projectId: project._id, title: 'Nope' });
      expect(res.status).toBe(403);
    });
  });

  // ── List ────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/tasks', () => {
    it('should list tasks in workspace', async () => {
      await createTask(workspace._id, project._id, ownerUser._id);
      await createTask(workspace._id, project._id, ownerUser._id, { title: 'Task 2' });
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      await createTask(workspace._id, project._id, ownerUser._id, { status: 'done' });
      await createTask(workspace._id, project._id, ownerUser._id, { title: 'T2', status: 'todo' });
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString(), status: 'done' });
      expect(res.status).toBe(200);
      expect(res.body.data.every((t) => t.status === 'done')).toBe(true);
    });

    it('should forbid non-member', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(403);
    });
  });

  // ── Get by ID ───────────────────────────────────────────────────────────────
  describe('GET /api/v1/tasks/:id', () => {
    it('should return task by ID', async () => {
      const task = await createTask(workspace._id, project._id, ownerUser._id);
      const res = await request(app)
        .get(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(task._id.toString());
    });
  });

  // ── Update ──────────────────────────────────────────────────────────────────
  describe('PUT /api/v1/tasks/:id', () => {
    it('should update task title', async () => {
      const task = await createTask(workspace._id, project._id, ownerUser._id);
      const res = await request(app)
        .put(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ title: 'Updated Title' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });
  });

  // ── Status ──────────────────────────────────────────────────────────────────
  describe('PATCH /api/v1/tasks/:id/status', () => {
    it('should update task status', async () => {
      const task = await createTask(workspace._id, project._id, ownerUser._id);
      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ status: 'in_progress' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('should reject invalid status', async () => {
      const task = await createTask(workspace._id, project._id, ownerUser._id);
      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ status: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  // ── Assignee ────────────────────────────────────────────────────────────────
  describe('PATCH /api/v1/tasks/:id/assignee', () => {
    it('should assign a task', async () => {
      const { user: assignee } = await createUserAndLogin();
      await addMember(workspace._id, assignee._id, 'member');
      const task = await createTask(workspace._id, project._id, ownerUser._id);
      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}/assignee`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ assigneeId: assignee._id.toString() });
      expect(res.status).toBe(200);
    });

    it('should unassign a task with null assigneeId', async () => {
      const task = await createTask(workspace._id, project._id, ownerUser._id);
      const res = await request(app)
        .patch(`/api/v1/tasks/${task._id}/assignee`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ assigneeId: null });
      expect(res.status).toBe(200);
    });
  });

  // ── Delete ──────────────────────────────────────────────────────────────────
  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete a task', async () => {
      const task = await createTask(workspace._id, project._id, ownerUser._id);
      const res = await request(app)
        .delete(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(200);
    });

    it('should forbid guest from deleting', async () => {
      const { accessToken: guestToken, user: guestUser } = await createUserAndLogin();
      await addMember(workspace._id, guestUser._id, 'guest');
      const task = await createTask(workspace._id, project._id, ownerUser._id);
      const res = await request(app)
        .delete(`/api/v1/tasks/${task._id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(403);
    });
  });
});
