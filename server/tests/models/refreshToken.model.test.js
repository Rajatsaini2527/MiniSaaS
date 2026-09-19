'use strict';

const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, RefreshToken } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('RefreshToken Model', () => {
  let user;

  beforeEach(async () => {
    user = await User.create({ name: 'Token User', email: 'token@example.com', password: 'password123' });
  });

  const getValidData = (userId) => ({
    userId,
    tokenHash: 'abc123hashvalue_unique',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  describe('Required fields', () => {
    it('should create a refresh token with valid data', async () => {
      const token = await RefreshToken.create(getValidData(user._id));
      expect(token._id).toBeDefined();
      expect(token.tokenHash).toBe('abc123hashvalue_unique');
    });

    it('should fail without userId', async () => {
      const { userId: _u, ...data } = getValidData(user._id);
      await expect(RefreshToken.create(data)).rejects.toThrow(/User is required/);
    });

    it('should fail without tokenHash', async () => {
      const { tokenHash: _t, ...data } = getValidData(user._id);
      await expect(RefreshToken.create(data)).rejects.toThrow(/Token hash is required/);
    });

    it('should fail without expiresAt', async () => {
      const { expiresAt: _e, ...data } = getValidData(user._id);
      await expect(RefreshToken.create(data)).rejects.toThrow(/Expiry date is required/);
    });
  });

  describe('Unique constraint', () => {
    it('should enforce tokenHash uniqueness', async () => {
      await RefreshToken.create(getValidData(user._id));
      const user2 = await User.create({ name: 'U2', email: 'u2@example.com', password: 'password123' });
      await expect(RefreshToken.create(getValidData(user2._id))).rejects.toThrow();
    });
  });

  describe('Defaults', () => {
    it('should default revokedAt to null', async () => {
      const token = await RefreshToken.create(getValidData(user._id));
      expect(token.revokedAt).toBeNull();
    });

    it('should default replacedByTokenId to null', async () => {
      const token = await RefreshToken.create(getValidData(user._id));
      expect(token.replacedByTokenId).toBeNull();
    });

    it('should set createdAt and updatedAt', async () => {
      const token = await RefreshToken.create(getValidData(user._id));
      expect(token.createdAt).toBeDefined();
      expect(token.updatedAt).toBeDefined();
    });
  });

  describe('Token rotation', () => {
    it('should allow linking to a replacement token', async () => {
      const token1 = await RefreshToken.create(getValidData(user._id));
      const token2 = await RefreshToken.create({ ...getValidData(user._id), tokenHash: 'newhash_xyz789' });
      token1.revokedAt = new Date();
      token1.replacedByTokenId = token2._id;
      await token1.save();
      const updated = await RefreshToken.findById(token1._id);
      expect(updated.revokedAt).toBeDefined();
      expect(updated.replacedByTokenId.toString()).toBe(token2._id.toString());
    });
  });
});
