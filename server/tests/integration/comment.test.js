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
const { Comment } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Comment API', () => {
  let ownerToken, ownerUser, workspace, project, task;

  beforeEach(async () => {
    const result = await createUserAndLogin({ name: 'Owner' });
    ownerToken = result.accessToken;
    ownerUser = result.user;
    workspace = await createWorkspace(ownerUser._id);
    await addOwnerMember(workspace._id, ownerUser._id);
    project = await createProject(workspace._id, ownerUser._id);
    task = await createTask(workspace._id, project._id, ownerUser._id);
  });

  describe('POST /api/v1/tasks/:taskId/comments', () => {
    it('should add a comment to a task', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ content: 'Great work!' });
      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Great work!');
    });

    it('should reject empty content', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ content: '' });
      expect(res.status).toBe(400);
    });

    it('should reject non-member', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .post(`/api/v1/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ workspaceId: workspace._id.toString() })
        .send({ content: 'Sneaky comment' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/tasks/:taskId/comments', () => {
    it('should list comments for a task', async () => {
      await Comment.create({ taskId: task._id, userId: ownerUser._id, content: 'Comment 1' });
      await Comment.create({ taskId: task._id, userId: ownerUser._id, content: 'Comment 2' });
      const res = await request(app)
        .get(`/api/v1/tasks/${task._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .query({ workspaceId: workspace._id.toString() });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('PUT /api/v1/comments/:id', () => {
    it('should update own comment', async () => {
      const comment = await Comment.create({
        taskId: task._id,
        userId: ownerUser._id,
        content: 'Original',
      });
      const res = await request(app)
        .put(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ content: 'Updated content' });
      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Updated content');
      expect(res.body.data.editedAt).not.toBeNull();
    });

    it('should forbid editing another user comment', async () => {
      const { accessToken: otherToken, user: otherUser } = await createUserAndLogin();
      await addMember(workspace._id, otherUser._id, 'member');
      const comment = await Comment.create({
        taskId: task._id,
        userId: ownerUser._id,
        content: 'Owners comment',
      });
      const res = await request(app)
        .put(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Hacked' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    it('should delete own comment', async () => {
      const comment = await Comment.create({
        taskId: task._id,
        userId: ownerUser._id,
        content: 'To be deleted',
      });
      const res = await request(app)
        .delete(`/api/v1/comments/${comment._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
    });
  });
});
