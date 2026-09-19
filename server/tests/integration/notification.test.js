'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { createUserAndLogin } = require('../helpers/auth.helper');
const { Notification } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Notification API', () => {
  let accessToken, user;

  beforeEach(async () => {
    const result = await createUserAndLogin();
    accessToken = result.accessToken;
    user = result.user;
  });

  const makeNotif = (userId, overrides = {}) =>
    Notification.create({
      userId,
      type: 'system',
      title: 'Test',
      message: 'Test notification',
      isRead: false,
      ...overrides,
    });

  describe('GET /api/v1/notifications', () => {
    it('should return user notifications', async () => {
      await makeNotif(user._id);
      await makeNotif(user._id);
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.meta.unreadCount).toBe(2);
    });

    it('should filter by isRead=true', async () => {
      await makeNotif(user._id, { isRead: false });
      await makeNotif(user._id, { isRead: true });
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ isRead: 'true' });
      expect(res.status).toBe(200);
      expect(res.body.data.every((n) => n.isRead === true)).toBe(true);
    });

    it('should not return other users notifications', async () => {
      const { user: other } = await createUserAndLogin();
      await makeNotif(other._id);
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const notif = await makeNotif(user._id);
      const res = await request(app)
        .patch(`/api/v1/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).not.toBeNull();
    });

    it('should return 404 for another users notification', async () => {
      const { user: other } = await createUserAndLogin();
      const notif = await makeNotif(other._id);
      const res = await request(app)
        .patch(`/api/v1/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await makeNotif(user._id);
      await makeNotif(user._id);
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);

      const afterRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(afterRes.body.meta.unreadCount).toBe(0);
    });
  });
});
