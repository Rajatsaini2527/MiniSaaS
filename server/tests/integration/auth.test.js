'use strict';

const request = require('supertest');
const app = require('../../src/app');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { createUserAndLogin } = require('../helpers/auth.helper');
const { hashPassword } = require('../../src/utils/hash');
const { User } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Auth API', () => {
  // ── Register ────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('alice@example.com');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await User.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: await hashPassword('password123'),
      });
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Alice2',
        email: 'alice@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'short',
      });
      expect(res.status).toBe(400);
    });

    it('should reject invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Bob',
        email: 'not-an-email',
        password: 'password123',
      });
      expect(res.status).toBe(400);
    });

    it('should reject missing name', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'bob@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(400);
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      await User.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: await hashPassword('password123'),
      });
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'alice@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject wrong password', async () => {
      await User.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: await hashPassword('password123'),
      });
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'alice@example.com',
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(401);
    });

    it('should reject suspended account', async () => {
      await User.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: await hashPassword('password123'),
        status: 'suspended',
      });
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'alice@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(403);
    });
  });

  // ── Refresh token ───────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/refresh-token', () => {
    it('should issue new access token with valid refresh token', async () => {
      await User.create({
        name: 'Refresh User',
        email: 'refresh@example.com',
        password: await hashPassword('password123'),
      });
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'refresh@example.com',
        password: 'password123',
      });
      expect(loginRes.status).toBe(200);

      // Extract refresh token from set-cookie header (URL-decode it)
      const setCookie = loginRes.headers['set-cookie'] || [];
      const cookieStr = setCookie.find((c) => c.startsWith('refreshToken=')) || '';
      const rawValue = cookieStr.split(';')[0].replace('refreshToken=', '');
      const refreshToken = decodeURIComponent(rawValue);

      expect(refreshToken).toBeTruthy();

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid.token.here' });
      expect(res.status).toBe(401);
    });

    it('should return 401 with no token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh-token').send({});
      expect(res.status).toBe(401);
    });
  });

  // ── Logout ──────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const { accessToken } = await createUserAndLogin();
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject logout without access token', async () => {
      const res = await request(app).post('/api/v1/auth/logout').send({});
      expect(res.status).toBe(401);
    });
  });

  // ── Get Me ──────────────────────────────────────────────────────────────────
  describe('GET /api/v1/auth/me', () => {
    it('should return current user', async () => {
      const { accessToken, user } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(user._id.toString());
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not.a.valid.token');
      expect(res.status).toBe(401);
    });
  });
});
