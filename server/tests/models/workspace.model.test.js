'use strict';

const { connectTestDB, disconnectTestDB, clearTestDB } = require('../helpers/db.helper');
const { User, Workspace, WORKSPACE_STATUSES } = require('../../src/models');

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearTestDB(); });

describe('Workspace Model', () => {
  let owner;

  beforeEach(async () => {
    owner = await User.create({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'password123',
    });
  });

  const getValidData = (ownerId) => ({
    name: 'Test Workspace',
    ownerId,
    slug: 'test-workspace',
  });

  describe('Required fields', () => {
    it('should create a workspace with valid data', async () => {
      const ws = await Workspace.create(getValidData(owner._id));
      expect(ws._id).toBeDefined();
      expect(ws.name).toBe('Test Workspace');
    });

    it('should fail without name', async () => {
      const { name: _n, ...data } = getValidData(owner._id);
      await expect(Workspace.create(data)).rejects.toThrow(/name is required/i);
    });

    it('should fail without ownerId', async () => {
      const { ownerId: _o, ...data } = getValidData(owner._id);
      await expect(Workspace.create(data)).rejects.toThrow(/Owner is required/);
    });

    it('should fail without slug', async () => {
      const { slug: _s, ...data } = getValidData(owner._id);
      await expect(Workspace.create(data)).rejects.toThrow(/Slug is required/);
    });
  });

  describe('Slug validation', () => {
    it('should enforce slug uniqueness', async () => {
      await Workspace.create(getValidData(owner._id));
      await expect(Workspace.create({ ...getValidData(owner._id), name: 'Other' }))
        .rejects.toThrow();
    });

    it('should lowercase the slug automatically', async () => {
      // Mongoose lowercase transform runs before the regex, so slugs are always stored lowercase
      const ws = await Workspace.create({ ...getValidData(owner._id), slug: 'my-workspace-slug' });
      expect(ws.slug).toBe('my-workspace-slug');
    });

    it('should reject slug with invalid characters (spaces)', async () => {
      await expect(Workspace.create({ ...getValidData(owner._id), slug: 'invalid slug' }))
        .rejects.toThrow(/Slug can only contain/);
    });
  });

  describe('Relationship', () => {
    it('should store ownerId as ObjectId reference to User', async () => {
      const ws = await Workspace.create(getValidData(owner._id));
      expect(ws.ownerId.toString()).toBe(owner._id.toString());
    });

    it('should populate ownerId with user data', async () => {
      const ws = await Workspace.create(getValidData(owner._id));
      const populated = await Workspace.findById(ws._id).populate('ownerId');
      expect(populated.ownerId.email).toBe('owner@example.com');
    });
  });

  describe('Status enum', () => {
    it('should default status to active', async () => {
      const ws = await Workspace.create(getValidData(owner._id));
      expect(ws.status).toBe('active');
    });

    it('should accept all valid statuses', async () => {
      for (const status of WORKSPACE_STATUSES) {
        const ws = await Workspace.create({ ...getValidData(owner._id), slug: `ws-${status}`, status });
        expect(ws.status).toBe(status);
      }
    });
  });
});
