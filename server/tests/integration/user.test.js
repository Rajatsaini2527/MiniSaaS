'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { createUserAndLogin } = require('../helpers/auth.helper');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('User API', () => {
  describe('GET /api/v1/users/me', () => {
    it('should return user profile', async () => {
      const { accessToken, user } = await createUserAndLogin({ name: 'Profile User' });
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(user._id.toString());
      expect(res.body.data.password).toBeUndefined();
    });

    it('should reject unauthenticated', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/me', () => {
    it('should update name', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should reject name too short', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'X' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid avatar URL', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ avatar: 'not-a-url' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/v1/users/me/password', () => {
    it('should change password successfully', async () => {
      const { accessToken, plainPassword } = await createUserAndLogin();
      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: plainPassword, newPassword: 'newpassword123' });
      expect(res.status).toBe(200);
    });

    it('should reject wrong current password', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });
      expect(res.status).toBe(400);
    });

    it('should reject new password too short', async () => {
      const { accessToken, plainPassword } = await createUserAndLogin();
      const res = await request(app)
        .put('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: plainPassword, newPassword: 'short' });
      expect(res.status).toBe(400);
    });
  });
});
